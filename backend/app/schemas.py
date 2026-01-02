"""Pydantic models for request/response validation."""

from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from pydantic import BaseModel, EmailStr


# Auth Request Models
class SignUpRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


# Auth Response Models
class UserInfo(BaseModel):
    """User info returned in auth responses."""
    id: str
    email: str
    created_at: str
    email_confirmed: bool = True


class AuthResponse(BaseModel):
    """Response for login/signup/refresh endpoints."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserInfo


class UserResponse(BaseModel):
    """Response for /me endpoint."""
    id: str
    email: str
    created_at: str
    updated_at: str | None = None
    user_metadata: dict = {}
    is_admin: bool = False


class MessageResponse(BaseModel):
    """Generic message response."""
    message: str


# ============================================================
# Card & Benefit Schemas
# ============================================================

class BenefitSchedule(str, Enum):
    """Schedule types for benefit redemption."""
    calendar_year = "calendar_year"
    card_year = "card_year"
    monthly = "monthly"
    quarterly = "quarterly"
    biannual = "biannual"
    one_time = "one_time"


# Card Schemas
class CardBase(BaseModel):
    """Base card fields."""
    name: str
    issuer: str
    image_url: str | None = None
    annual_fee: Decimal = Decimal("0")


class CardCreate(CardBase):
    """Request to create a new card."""
    pass


class CardUpdate(BaseModel):
    """Request to update a card."""
    name: str | None = None
    issuer: str | None = None
    image_url: str | None = None
    annual_fee: Decimal | None = None


class Card(CardBase):
    """Card response model."""
    id: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


# Benefit Schemas
class BenefitBase(BaseModel):
    """Base benefit fields."""
    name: str
    description: str | None = None
    value: Decimal
    schedule: BenefitSchedule


class BenefitCreate(BenefitBase):
    """Request to create a new benefit."""
    pass


class BenefitUpdate(BaseModel):
    """Request to update a benefit."""
    name: str | None = None
    description: str | None = None
    value: Decimal | None = None
    schedule: BenefitSchedule | None = None


class Benefit(BenefitBase):
    """Benefit response model."""
    id: str
    card_id: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


class CardWithBenefits(Card):
    """Card with its associated benefits."""
    benefits: list[Benefit] = []


# User Card Schemas
class UserCardCreate(BaseModel):
    """Request to add a card to user's profile."""
    card_id: str
    card_open_date: date
    nickname: str | None = None


class UserCard(BaseModel):
    """User's card response model."""
    id: str
    user_id: str
    card_id: str
    card_open_date: date
    nickname: str | None = None
    card: Card
    created_at: datetime | None = None
    updated_at: datetime | None = None


# Benefit Redemption Schemas
class BenefitRedemptionCreate(BaseModel):
    """Request to mark a benefit as redeemed."""
    pass  # Period info is calculated server-side


class BenefitRedemption(BaseModel):
    """Benefit redemption record."""
    id: str
    user_card_id: str
    benefit_id: str
    redeemed_at: datetime
    period_year: int
    period_month: int | None = None
    period_quarter: int | None = None
    period_half: int | None = None


# User Benefit Preference Schemas
class BenefitPreferenceUpdate(BaseModel):
    """Request to update benefit preferences."""
    auto_redeem: bool | None = None
    hidden: bool | None = None


class BenefitPreference(BaseModel):
    """Benefit preference record."""
    id: str
    user_card_id: str
    benefit_id: str
    auto_redeem: bool = False
    hidden: bool = False
    created_at: datetime | None = None
    updated_at: datetime | None = None


# Available Benefit (for dashboard)
class AvailableBenefit(BaseModel):
    """Benefit with availability status for dashboard."""
    benefit: Benefit
    user_card: UserCard
    is_redeemed: bool
    resets_at: date | None = None
    auto_redeem: bool = False
    hidden: bool = False


# Yearly Summary Schemas
class BenefitSummary(BaseModel):
    """Summary stats for a single benefit in a year."""
    benefit: Benefit
    redeemed_count: int
    total_count: int
    redeemed_value: Decimal
    total_value: Decimal


class CardSummary(BaseModel):
    """Yearly summary for a user's card."""
    user_card: UserCard
    year: int
    benefits: list[BenefitSummary]
    total_redeemed: Decimal
    total_available: Decimal


class UserCardWithBenefits(UserCard):
    """User's card with benefits and redemption status."""
    benefits: list[AvailableBenefit] = []


class AnnualSummary(BaseModel):
    """Annual summary across all user's cards (calendar year focus)."""
    year: int
    total_redeemed: Decimal
    total_available: Decimal
    outstanding: Decimal  # total_available - total_redeemed
    redeemed_count: int
    total_count: int
