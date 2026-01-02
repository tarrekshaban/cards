"""Admin endpoints for managing the card catalog."""

from decimal import Decimal
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from gotrue.types import User

from ..dependencies import get_supabase_admin_client, require_admin
from ..services.cache import catalog_cache
from ..schemas import (
    BenefitSchedule,
    Card,
    CardCreate,
    CardUpdate,
    CardWithBenefits,
    Benefit,
    BenefitCreate,
    BenefitUpdate,
    AccessCode,
    AccessCodeCreate,
)
import secrets
import string

router = APIRouter()


def _parse_card(row: dict) -> Card:
    """Parse a card row from Supabase."""
    return Card(
        id=row["id"],
        name=row["name"],
        issuer=row["issuer"],
        image_url=row.get("image_url"),
        annual_fee=Decimal(str(row.get("annual_fee", 0))),
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


# ============================================================
# Card Management
# ============================================================

@router.post("/cards", response_model=Card, status_code=status.HTTP_201_CREATED)
async def create_card(
    request: CardCreate,
    current_user: Annotated[User, Depends(require_admin)],
    supabase: Annotated[Client, Depends(get_supabase_admin_client)],
):
    """Create a new card in the catalog."""
    result = supabase.table("cards").insert({
        "name": request.name,
        "issuer": request.issuer,
        "image_url": request.image_url,
        "annual_fee": float(request.annual_fee),
    }).execute()
    
    # Invalidate cache
    catalog_cache.invalidate("cards:")
    
    return _parse_card(result.data[0])


@router.put("/cards/{card_id}", response_model=Card)
async def update_card(
    card_id: str,
    request: CardUpdate,
    current_user: Annotated[User, Depends(require_admin)],
    supabase: Annotated[Client, Depends(get_supabase_admin_client)],
):
    """Update a card in the catalog."""
    # Check if card exists
    existing = supabase.table("cards").select("id").eq("id", card_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    
    # Build update dict with only provided fields
    update_data = {}
    if request.name is not None:
        update_data["name"] = request.name
    if request.issuer is not None:
        update_data["issuer"] = request.issuer
    if request.image_url is not None:
        update_data["image_url"] = request.image_url
    if request.annual_fee is not None:
        update_data["annual_fee"] = float(request.annual_fee)
    
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
    
    result = supabase.table("cards").update(update_data).eq("id", card_id).execute()
    
    # Invalidate cache
    catalog_cache.invalidate("cards:")
    
    return _parse_card(result.data[0])


@router.delete("/cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_card(
    card_id: str,
    current_user: Annotated[User, Depends(require_admin)],
    supabase: Annotated[Client, Depends(get_supabase_admin_client)],
):
    """Delete a card from the catalog."""
    # Check if card exists
    existing = supabase.table("cards").select("id").eq("id", card_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    
    supabase.table("cards").delete().eq("id", card_id).execute()
    
    # Invalidate cache
    catalog_cache.invalidate("cards:")


# ============================================================
# Benefit Management
# ============================================================

@router.post("/cards/{card_id}/benefits", response_model=Benefit, status_code=status.HTTP_201_CREATED)
async def create_benefit(
    card_id: str,
    request: BenefitCreate,
    current_user: Annotated[User, Depends(require_admin)],
    supabase: Annotated[Client, Depends(get_supabase_admin_client)],
):
    """Add a benefit to a card."""
    # Verify card exists
    card_result = supabase.table("cards").select("id").eq("id", card_id).execute()
    if not card_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    
    result = supabase.table("benefits").insert({
        "card_id": card_id,
        "name": request.name,
        "description": request.description,
        "value": float(request.value),
        "schedule": request.schedule.value,
    }).execute()
    
    # Invalidate cache for this card
    catalog_cache.invalidate(f"cards:{card_id}")
    
    return _parse_benefit(result.data[0])


@router.post("/cards/{card_id}/benefits/bulk", response_model=list[Benefit], status_code=status.HTTP_201_CREATED)
async def bulk_create_benefits(
    card_id: str,
    request: list[BenefitCreate],
    current_user: Annotated[User, Depends(require_admin)],
    supabase: Annotated[Client, Depends(get_supabase_admin_client)],
):
    """Bulk add multiple benefits to a card at once."""
    # Verify card exists
    card_result = supabase.table("cards").select("id").eq("id", card_id).execute()
    if not card_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    
    if not request:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No benefits provided")
    
    # Prepare all benefits for insertion
    benefits_data = [
        {
            "card_id": card_id,
            "name": b.name,
            "description": b.description,
            "value": float(b.value),
            "schedule": b.schedule.value,
        }
        for b in request
    ]
    
    # Batch insert
    result = supabase.table("benefits").insert(benefits_data).execute()
    
    # Invalidate cache for this card
    catalog_cache.invalidate(f"cards:{card_id}")
    
    return [_parse_benefit(row) for row in result.data]


@router.put("/benefits/{benefit_id}", response_model=Benefit)
async def update_benefit(
    benefit_id: str,
    request: BenefitUpdate,
    current_user: Annotated[User, Depends(require_admin)],
    supabase: Annotated[Client, Depends(get_supabase_admin_client)],
):
    """Update a benefit."""
    # Check if benefit exists
    existing = supabase.table("benefits").select("id, card_id").eq("id", benefit_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Benefit not found")
    
    card_id = existing.data[0]["card_id"]
    
    # Build update dict with only provided fields
    update_data = {}
    if request.name is not None:
        update_data["name"] = request.name
    if request.description is not None:
        update_data["description"] = request.description
    if request.value is not None:
        update_data["value"] = float(request.value)
    if request.schedule is not None:
        update_data["schedule"] = request.schedule.value
    
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
    
    result = supabase.table("benefits").update(update_data).eq("id", benefit_id).execute()
    
    # Invalidate cache for this card
    catalog_cache.invalidate(f"cards:{card_id}")
    
    return _parse_benefit(result.data[0])


@router.delete("/benefits/{benefit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_benefit(
    benefit_id: str,
    current_user: Annotated[User, Depends(require_admin)],
    supabase: Annotated[Client, Depends(get_supabase_admin_client)],
):
    """Delete a benefit."""
    # Check if benefit exists
    existing = supabase.table("benefits").select("id, card_id").eq("id", benefit_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Benefit not found")
    
    card_id = existing.data[0]["card_id"]
    
    supabase.table("benefits").delete().eq("id", benefit_id).execute()
    
    # Invalidate cache for this card
    catalog_cache.invalidate(f"cards:{card_id}")


@router.get("/cards/{card_id}", response_model=CardWithBenefits)
async def get_card_with_benefits(
    card_id: str,
    current_user: Annotated[User, Depends(require_admin)],
    supabase: Annotated[Client, Depends(get_supabase_admin_client)],
):
    """Get a card with all its benefits (admin view)."""
    # Get card
    card_result = supabase.table("cards").select("*").eq("id", card_id).execute()
    if not card_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    
    card = _parse_card(card_result.data[0])
    
    # Get benefits
    benefits_result = supabase.table("benefits").select("*").eq("card_id", card_id).order("name").execute()
    benefits = [_parse_benefit(row) for row in benefits_result.data]
    
    return CardWithBenefits(**card.model_dump(), benefits=benefits)


# ============================================================
# Access Code Management
# ============================================================

def _generate_access_code() -> str:
    """Generate a random 8-character access code."""
    alphabet = string.ascii_uppercase + string.digits
    # Remove ambiguous characters
    alphabet = alphabet.replace('O', '').replace('0', '').replace('I', '').replace('1', '').replace('L', '')
    return ''.join(secrets.choice(alphabet) for _ in range(8))


def _parse_access_code(row: dict) -> AccessCode:
    """Parse an access code row from Supabase."""
    return AccessCode(
        id=row["id"],
        code=row["code"],
        created_at=row.get("created_at"),
        created_by=row.get("created_by"),
        used_at=row.get("used_at"),
        used_by=row.get("used_by"),
        invalidated_at=row.get("invalidated_at"),
        notes=row.get("notes"),
    )


@router.get("/access-codes", response_model=list[AccessCode])
async def list_access_codes(
    current_user: Annotated[User, Depends(require_admin)],
    supabase: Annotated[Client, Depends(get_supabase_admin_client)],
):
    """List all access codes."""
    result = supabase.table("access_codes").select("*").order("created_at", desc=True).execute()
    return [_parse_access_code(row) for row in result.data]


@router.post("/access-codes", response_model=AccessCode, status_code=status.HTTP_201_CREATED)
async def create_access_code(
    request: AccessCodeCreate,
    current_user: Annotated[User, Depends(require_admin)],
    supabase: Annotated[Client, Depends(get_supabase_admin_client)],
):
    """Generate a new access code."""
    # Generate unique code
    max_attempts = 10
    for _ in range(max_attempts):
        code = _generate_access_code()
        # Check if code already exists
        existing = supabase.table("access_codes").select("id").eq("code", code).execute()
        if not existing.data:
            break
    else:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate unique code")
    
    result = supabase.table("access_codes").insert({
        "code": code,
        "created_by": current_user.id,
        "notes": request.notes,
    }).execute()
    
    return _parse_access_code(result.data[0])


@router.delete("/access-codes/{code_id}", status_code=status.HTTP_204_NO_CONTENT)
async def invalidate_access_code(
    code_id: str,
    current_user: Annotated[User, Depends(require_admin)],
    supabase: Annotated[Client, Depends(get_supabase_admin_client)],
):
    """Invalidate an access code (soft delete)."""
    # Check if code exists
    existing = supabase.table("access_codes").select("id").eq("id", code_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Access code not found")
    
    # Soft delete by setting invalidated_at
    supabase.table("access_codes").update({
        "invalidated_at": "now()",
    }).eq("id", code_id).execute()
