from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.jwt_handler import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.transaction import (
    BalanceResponse,
    CreditPurchaseRequest,
    CreditTransferRequest,
    TransactionResponse,
)
from app.services.transaction_service import TransactionService

router = APIRouter(prefix="/api/v1/transactions", tags=["Transactions"])


def get_transaction_service(db: Session = Depends(get_db)) -> TransactionService:
    return TransactionService(db)


@router.get("/", response_model=List[TransactionResponse])
def get_my_transactions(
    current_user: User = Depends(get_current_user),
    service: TransactionService = Depends(get_transaction_service),
):
    """Get the current user's transaction history."""
    return service.get_user_transactions(current_user.id)


@router.get("/balance", response_model=BalanceResponse)
def get_my_balance(
    current_user: User = Depends(get_current_user),
):
    """Get the current user's time credit balance."""
    return BalanceResponse(user_id=current_user.id, balance=current_user.balance)


@router.post("/purchase", response_model=TransactionResponse)
def purchase_credits(
    data: CreditPurchaseRequest,
    current_user: User = Depends(get_current_user),
    service: TransactionService = Depends(get_transaction_service),
):
    """Purchase time credits using a card via the payment gateway."""
    return service.purchase_credits(
        user_id=current_user.id,
        card_number=data.card_number,
        expiration_date=data.expiration_date,
        cvc=data.cvc,
        amount=data.amount,
    )


@router.post("/transfer", response_model=TransactionResponse)
def transfer_credits(
    data: CreditTransferRequest,
    current_user: User = Depends(get_current_user),
    service: TransactionService = Depends(get_transaction_service),
):
    """Transfer time credits to another user."""
    return service.transfer_credits(
        sender_id=current_user.id,
        amount=data.amount,
        receiver_id=data.receiver_id,
        receiver_email=data.receiver_email,
    )
