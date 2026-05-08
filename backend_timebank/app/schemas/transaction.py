from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


class CreditPurchaseRequest(BaseModel):
    """Schema for buying time credits via Stripe."""
    amount: float = Field(..., gt=0)


class CheckoutSessionResponse(BaseModel):
    """Schema for returning the Stripe Checkout URL."""
    checkout_url: str


class CreditTransferRequest(BaseModel):
    """Schema for transferring time credits to another user."""
    receiver_id: Optional[int] = None
    receiver_email: Optional[EmailStr] = None
    amount: float = Field(..., gt=0)

    @model_validator(mode="after")
    def validate_receiver(self):
        if self.receiver_id is None and self.receiver_email is None:
            raise ValueError("receiver_id or receiver_email is required")
        return self


class TransactionResponse(BaseModel):
    """Schema for transaction data in API responses."""
    id: int
    sender_id: Optional[int]
    sender_name: Optional[str] = None
    receiver_id: int
    receiver_name: Optional[str] = None
    amount: float
    transaction_type: str
    service_request_id: Optional[int]
    description: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BalanceResponse(BaseModel):
    """Schema for user balance response."""
    user_id: int
    balance: float
