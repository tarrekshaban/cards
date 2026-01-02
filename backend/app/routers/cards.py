"""Card catalog and user card management endpoints."""

from datetime import date, datetime
from decimal import Decimal
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client
from gotrue.types import User

from ..dependencies import get_supabase_admin_client, get_current_user
from ..services.cache import catalog_cache
from ..schemas import (
    BenefitSchedule,
    Card,
    CardWithBenefits,
    Benefit,
    UserCard,
    UserCardCreate,
    UserCardWithBenefits,
    AvailableBenefit,
    BenefitRedemption,
    BenefitSummary,
    CardSummary,
)

router = APIRouter()


def _parse_card(row: dict) -> Card:
    """Parse a card row from Supabase."""
    return Card(
        id=row["id"],
        name=row["name"],
        issuer=row["issuer"],
        image_url=row.get("image_url"),
        created_at=row.get("created_at"),
        updated_at=row.get("updated_at"),
    )


def _parse_benefit(row: dict) -> Benefit:
    """Parse a benefit row from Supabase."""
    return Benefit(
        id=row["id"],
        card_id=row["card_id"],
        name=row["name"],
        description=row.get("description"),
        value=Decimal(str(row["value"])),
        schedule=BenefitSchedule(row["schedule"]),
        created_at=row.get("created_at"),
        updated_at=row.get("updated_at"),
    )


def _parse_user_card(row: dict, card: Card) -> UserCard:
    """Parse a user_card row from Supabase."""
    return UserCard(
        id=row["id"],
        user_id=row["user_id"],
        card_id=row["card_id"],
        card_open_date=date.fromisoformat(row["card_open_date"]) if isinstance(row["card_open_date"], str) else row["card_open_date"],
        card=card,
        created_at=row.get("created_at"),
        updated_at=row.get("updated_at"),
    )


def _calculate_current_period(schedule: BenefitSchedule, card_open_date: date) -> tuple[int, int | None, int | None, int | None]:
    """Calculate the current period (year, month, quarter, half) for a benefit schedule."""
    today = date.today()
    
    if schedule == BenefitSchedule.calendar_year:
        return (today.year, None, None, None)
    elif schedule == BenefitSchedule.card_year:
        # Card year is based on anniversary
        years_since_open = today.year - card_open_date.year
        if (today.month, today.day) < (card_open_date.month, card_open_date.day):
            years_since_open -= 1
        return (years_since_open, None, None, None)
    elif schedule == BenefitSchedule.monthly:
        return (today.year, today.month, None, None)
    elif schedule == BenefitSchedule.quarterly:
        quarter = (today.month - 1) // 3 + 1
        return (today.year, None, quarter, None)
    elif schedule == BenefitSchedule.biannual:
        half = 1 if today.month <= 6 else 2
        return (today.year, None, None, half)
    elif schedule == BenefitSchedule.one_time:
        return (0, None, None, None)  # Special case: one-time has no period
    
    return (today.year, None, None, None)


def _calculate_reset_date(schedule: BenefitSchedule, card_open_date: date) -> date | None:
    """Calculate when a benefit resets."""
    today = date.today()
    
    if schedule == BenefitSchedule.calendar_year:
        return date(today.year + 1, 1, 1)
    elif schedule == BenefitSchedule.card_year:
        next_anniversary = date(today.year, card_open_date.month, card_open_date.day)
        if next_anniversary <= today:
            next_anniversary = date(today.year + 1, card_open_date.month, card_open_date.day)
        return next_anniversary
    elif schedule == BenefitSchedule.monthly:
        if today.month == 12:
            return date(today.year + 1, 1, 1)
        return date(today.year, today.month + 1, 1)
    elif schedule == BenefitSchedule.quarterly:
        quarter = (today.month - 1) // 3 + 1
        if quarter == 4:
            return date(today.year + 1, 1, 1)
        return date(today.year, quarter * 3 + 1, 1)
    elif schedule == BenefitSchedule.biannual:
        if today.month <= 6:
            return date(today.year, 7, 1)
        return date(today.year + 1, 1, 1)
    elif schedule == BenefitSchedule.one_time:
        return None  # One-time benefits never reset
    
    return None


def _get_total_count_for_year(schedule: BenefitSchedule) -> int:
    """Get the total number of redemptions possible in a year for a schedule type."""
    if schedule == BenefitSchedule.monthly:
        return 12
    elif schedule == BenefitSchedule.quarterly:
        return 4
    elif schedule == BenefitSchedule.biannual:
        return 2
    elif schedule in (BenefitSchedule.calendar_year, BenefitSchedule.card_year):
        return 1
    elif schedule == BenefitSchedule.one_time:
        return 1
    return 1


# ============================================================
# Card Catalog Endpoints
# ============================================================

@router.get("/cards", response_model=list[Card])
async def list_cards(
    current_user: Annotated[User, Depends(get_current_user)],
    supabase: Annotated[Client, Depends(get_supabase_admin_client)],
):
    """List all cards in the catalog."""
    cache_key = "cards:list"
    cached = catalog_cache.get(cache_key)
    if cached is not None:
        return cached

    result = supabase.table("cards").select("*").order("name").execute()
    cards = [_parse_card(row) for row in result.data]
    
    catalog_cache.set(cache_key, cards)
    return cards


@router.get("/cards/{card_id}", response_model=CardWithBenefits)
async def get_card(
    card_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    supabase: Annotated[Client, Depends(get_supabase_admin_client)],
):
    """Get a card with its benefits."""
    cache_key = f"cards:{card_id}"
    cached = catalog_cache.get(cache_key)
    if cached is not None:
        return cached

    # Get card
    card_result = supabase.table("cards").select("*").eq("id", card_id).execute()
    if not card_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    
    card = _parse_card(card_result.data[0])
    
    # Get benefits
    benefits_result = supabase.table("benefits").select("*").eq("card_id", card_id).order("name").execute()
    benefits = [_parse_benefit(row) for row in benefits_result.data]
    
    full_card = CardWithBenefits(**card.model_dump(), benefits=benefits)
    catalog_cache.set(cache_key, full_card)
    return full_card


# ============================================================
# User Card Endpoints
# ============================================================

@router.get("/user/cards", response_model=list[UserCardWithBenefits])
async def list_user_cards(
    current_user: Annotated[User, Depends(get_current_user)],
    supabase: Annotated[Client, Depends(get_supabase_admin_client)],
):
    """List all cards the user has added with benefits and redemption status."""
    # Get user's cards with card details
    user_cards_result = supabase.table("user_cards").select(
        "*, cards(*)"
    ).eq("user_id", current_user.id).execute()
    
    result = []
    for uc_row in user_cards_result.data:
        card = _parse_card(uc_row["cards"])
        user_card = _parse_user_card(uc_row, card)
        
        # Get benefits for this card
        benefits_result = supabase.table("benefits").select("*").eq("card_id", card.id).execute()
        
        # Get redemptions for this user_card
        redemptions_result = supabase.table("benefit_redemptions").select("*").eq("user_card_id", user_card.id).execute()
        redemptions_by_benefit: dict[str, list[dict]] = {}
        for r in redemptions_result.data:
            bid = r["benefit_id"]
            if bid not in redemptions_by_benefit:
                redemptions_by_benefit[bid] = []
            redemptions_by_benefit[bid].append(r)
        
        available_benefits = []
        for b_row in benefits_result.data:
            benefit = _parse_benefit(b_row)
            period = _calculate_current_period(benefit.schedule, user_card.card_open_date)
            
            # Check if redeemed in current period
            is_redeemed = False
            if benefit.id in redemptions_by_benefit:
                for r in redemptions_by_benefit[benefit.id]:
                    if benefit.schedule == BenefitSchedule.one_time:
                        is_redeemed = True
                        break
                    elif r["period_year"] == period[0]:
                        if period[1] is not None and r.get("period_month") == period[1]:
                            is_redeemed = True
                            break
                        elif period[2] is not None and r.get("period_quarter") == period[2]:
                            is_redeemed = True
                            break
                        elif period[3] is not None and r.get("period_half") == period[3]:
                            is_redeemed = True
                            break
                        elif period[1] is None and period[2] is None and period[3] is None:
                            is_redeemed = True
                            break
            
            available_benefits.append(AvailableBenefit(
                benefit=benefit,
                user_card=user_card,
                is_redeemed=is_redeemed,
                resets_at=_calculate_reset_date(benefit.schedule, user_card.card_open_date),
            ))
        
        result.append(UserCardWithBenefits(**user_card.model_dump(), benefits=available_benefits))
    
    return result


@router.post("/user/cards", response_model=UserCard, status_code=status.HTTP_201_CREATED)
async def add_user_card(
    request: UserCardCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    supabase: Annotated[Client, Depends(get_supabase_admin_client)],
):
    """Add a card to the user's profile."""
    # Verify card exists
    card_result = supabase.table("cards").select("*").eq("id", request.card_id).execute()
    if not card_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    
    # Check if user already has this card
    existing = supabase.table("user_cards").select("id").eq("user_id", current_user.id).eq("card_id", request.card_id).execute()
    if existing.data:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Card already added to profile")
    
    # Add card
    result = supabase.table("user_cards").insert({
        "user_id": current_user.id,
        "card_id": request.card_id,
        "card_open_date": request.card_open_date.isoformat(),
    }).execute()
    
    card = _parse_card(card_result.data[0])
    return _parse_user_card(result.data[0], card)


@router.delete("/user/cards/{user_card_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_user_card(
    user_card_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    supabase: Annotated[Client, Depends(get_supabase_admin_client)],
):
    """Remove a card from the user's profile."""
    # Verify ownership
    result = supabase.table("user_cards").select("id").eq("id", user_card_id).eq("user_id", current_user.id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found in your profile")
    
    supabase.table("user_cards").delete().eq("id", user_card_id).execute()


# ============================================================
# Available Benefits (Dashboard)
# ============================================================

@router.get("/user/benefits/available", response_model=list[AvailableBenefit])
async def list_available_benefits(
    current_user: Annotated[User, Depends(get_current_user)],
    supabase: Annotated[Client, Depends(get_supabase_admin_client)],
):
    """List all unredeemed benefits across all user's cards (for dashboard)."""
    # Get user's cards
    user_cards_result = supabase.table("user_cards").select("*, cards(*)").eq("user_id", current_user.id).execute()
    
    available = []
    for uc_row in user_cards_result.data:
        card = _parse_card(uc_row["cards"])
        user_card = _parse_user_card(uc_row, card)
        
        # Get benefits
        benefits_result = supabase.table("benefits").select("*").eq("card_id", card.id).execute()
        
        # Get redemptions
        redemptions_result = supabase.table("benefit_redemptions").select("*").eq("user_card_id", user_card.id).execute()
        redemptions_by_benefit: dict[str, list[dict]] = {}
        for r in redemptions_result.data:
            bid = r["benefit_id"]
            if bid not in redemptions_by_benefit:
                redemptions_by_benefit[bid] = []
            redemptions_by_benefit[bid].append(r)
        
        for b_row in benefits_result.data:
            benefit = _parse_benefit(b_row)
            period = _calculate_current_period(benefit.schedule, user_card.card_open_date)
            
            # Check if redeemed
            is_redeemed = False
            if benefit.id in redemptions_by_benefit:
                for r in redemptions_by_benefit[benefit.id]:
                    if benefit.schedule == BenefitSchedule.one_time:
                        is_redeemed = True
                        break
                    elif r["period_year"] == period[0]:
                        if period[1] is not None and r.get("period_month") == period[1]:
                            is_redeemed = True
                            break
                        elif period[2] is not None and r.get("period_quarter") == period[2]:
                            is_redeemed = True
                            break
                        elif period[3] is not None and r.get("period_half") == period[3]:
                            is_redeemed = True
                            break
                        elif period[1] is None and period[2] is None and period[3] is None:
                            is_redeemed = True
                            break
            
            if not is_redeemed:
                available.append(AvailableBenefit(
                    benefit=benefit,
                    user_card=user_card,
                    is_redeemed=False,
                    resets_at=_calculate_reset_date(benefit.schedule, user_card.card_open_date),
                ))
    
    # Sort by reset date (soonest first), then by value (highest first)
    available.sort(key=lambda x: (x.resets_at or date.max, -x.benefit.value))
    
    return available


# ============================================================
# Card Summary (Yearly Stats)
# ============================================================

@router.get("/user/cards/{user_card_id}/summary", response_model=CardSummary)
async def get_card_summary(
    user_card_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    supabase: Annotated[Client, Depends(get_supabase_admin_client)],
    year: int = Query(default_factory=lambda: date.today().year),
):
    """Get yearly summary stats for a user's card."""
    # Get user card with card details
    uc_result = supabase.table("user_cards").select("*, cards(*)").eq("id", user_card_id).eq("user_id", current_user.id).execute()
    if not uc_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found in your profile")
    
    uc_row = uc_result.data[0]
    card = _parse_card(uc_row["cards"])
    user_card = _parse_user_card(uc_row, card)
    
    # Get benefits
    benefits_result = supabase.table("benefits").select("*").eq("card_id", card.id).execute()
    
    # Get redemptions for the year
    redemptions_result = supabase.table("benefit_redemptions").select("*").eq("user_card_id", user_card_id).eq("period_year", year).execute()
    
    # Count redemptions per benefit
    redemption_counts: dict[str, int] = {}
    for r in redemptions_result.data:
        bid = r["benefit_id"]
        redemption_counts[bid] = redemption_counts.get(bid, 0) + 1
    
    benefit_summaries = []
    total_redeemed = Decimal("0")
    total_available = Decimal("0")
    
    for b_row in benefits_result.data:
        benefit = _parse_benefit(b_row)
        total_count = _get_total_count_for_year(benefit.schedule)
        redeemed_count = redemption_counts.get(benefit.id, 0)
        
        redeemed_value = benefit.value * redeemed_count
        total_value = benefit.value * total_count
        
        total_redeemed += redeemed_value
        total_available += total_value
        
        benefit_summaries.append(BenefitSummary(
            benefit=benefit,
            redeemed_count=redeemed_count,
            total_count=total_count,
            redeemed_value=redeemed_value,
            total_value=total_value,
        ))
    
    return CardSummary(
        user_card=user_card,
        year=year,
        benefits=benefit_summaries,
        total_redeemed=total_redeemed,
        total_available=total_available,
    )


# ============================================================
# Benefit Redemption
# ============================================================

@router.post("/user/cards/{user_card_id}/benefits/{benefit_id}/redeem", response_model=BenefitRedemption, status_code=status.HTTP_201_CREATED)
async def redeem_benefit(
    user_card_id: str,
    benefit_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    supabase: Annotated[Client, Depends(get_supabase_admin_client)],
):
    """Mark a benefit as redeemed for the current period."""
    # Verify ownership
    uc_result = supabase.table("user_cards").select("*").eq("id", user_card_id).eq("user_id", current_user.id).execute()
    if not uc_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found in your profile")
    
    user_card_row = uc_result.data[0]
    card_open_date = date.fromisoformat(user_card_row["card_open_date"]) if isinstance(user_card_row["card_open_date"], str) else user_card_row["card_open_date"]
    
    # Verify benefit exists and belongs to the card
    benefit_result = supabase.table("benefits").select("*").eq("id", benefit_id).eq("card_id", user_card_row["card_id"]).execute()
    if not benefit_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Benefit not found for this card")
    
    benefit = _parse_benefit(benefit_result.data[0])
    period = _calculate_current_period(benefit.schedule, card_open_date)
    
    # Check if already redeemed
    existing_query = supabase.table("benefit_redemptions").select("id").eq("user_card_id", user_card_id).eq("benefit_id", benefit_id).eq("period_year", period[0])
    
    if period[1] is not None:
        existing_query = existing_query.eq("period_month", period[1])
    if period[2] is not None:
        existing_query = existing_query.eq("period_quarter", period[2])
    if period[3] is not None:
        existing_query = existing_query.eq("period_half", period[3])
    
    existing = existing_query.execute()
    if existing.data:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Benefit already redeemed for this period")
    
    # Create redemption
    result = supabase.table("benefit_redemptions").insert({
        "user_card_id": user_card_id,
        "benefit_id": benefit_id,
        "period_year": period[0],
        "period_month": period[1],
        "period_quarter": period[2],
        "period_half": period[3],
    }).execute()
    
    row = result.data[0]
    return BenefitRedemption(
        id=row["id"],
        user_card_id=row["user_card_id"],
        benefit_id=row["benefit_id"],
        redeemed_at=row["redeemed_at"],
        period_year=row["period_year"],
        period_month=row.get("period_month"),
        period_quarter=row.get("period_quarter"),
        period_half=row.get("period_half"),
    )


@router.delete("/user/cards/{user_card_id}/benefits/{benefit_id}/redeem", status_code=status.HTTP_204_NO_CONTENT)
async def unredeem_benefit(
    user_card_id: str,
    benefit_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    supabase: Annotated[Client, Depends(get_supabase_admin_client)],
):
    """Unmark a benefit redemption for the current period."""
    # Verify ownership
    uc_result = supabase.table("user_cards").select("*").eq("id", user_card_id).eq("user_id", current_user.id).execute()
    if not uc_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found in your profile")
    
    user_card_row = uc_result.data[0]
    card_open_date = date.fromisoformat(user_card_row["card_open_date"]) if isinstance(user_card_row["card_open_date"], str) else user_card_row["card_open_date"]
    
    # Get benefit for schedule
    benefit_result = supabase.table("benefits").select("*").eq("id", benefit_id).execute()
    if not benefit_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Benefit not found")
    
    benefit = _parse_benefit(benefit_result.data[0])
    period = _calculate_current_period(benefit.schedule, card_open_date)
    
    # Find and delete redemption
    delete_query = supabase.table("benefit_redemptions").delete().eq("user_card_id", user_card_id).eq("benefit_id", benefit_id).eq("period_year", period[0])
    
    if period[1] is not None:
        delete_query = delete_query.eq("period_month", period[1])
    if period[2] is not None:
        delete_query = delete_query.eq("period_quarter", period[2])
    if period[3] is not None:
        delete_query = delete_query.eq("period_half", period[3])
    
    delete_query.execute()
