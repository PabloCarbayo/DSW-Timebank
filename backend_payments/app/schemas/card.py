from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CardBase(BaseModel):
    """Base schema with shared card fields."""
    cardholder_name: str
    card_number: str
    expiration_date: str = Field(..., pattern=r"^(0[1-9]|1[0-2])\/\d{2}$")
    cvc: str = Field(..., min_length=3, max_length=4)


class CardCreate(CardBase):
    """Schema for registering a new card with an optional initial balance."""
    initial_balance: Decimal = Decimal("0.00")


class CardResponse(CardBase):
    """Schema for card data in API responses."""
    id: int
    balance: Decimal

    model_config = ConfigDict(from_attributes=True)


class CardVerify(BaseModel):
    """Schema for verifying card credentials."""
    card_number: str
    expiration_date: str
    cvc: str


class PaymentRequest(BaseModel):
    """Schema for processing a card payment."""
    card_number: str
    expiration_date: str
    cvc: str
    amount: Decimal = Field(..., gt=0)


class TopUpRequest(BaseModel):
    """Schema for adding funds to a card."""
    card_number: str
    expiration_date: str
    cvc: str
    amount: Decimal = Field(..., gt=0)
