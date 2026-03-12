from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.card import CardCreate, CardResponse, CardVerify, PaymentRequest, TopUpRequest
from app.services.card_service import CardService

router = APIRouter(prefix="/api/v1/cards", tags=["Cards"])


def get_card_service(db: Session = Depends(get_db)) -> CardService:
    return CardService(db)


@router.post("/", response_model=CardResponse)
def register_card(
    card_in: CardCreate,
    service: CardService = Depends(get_card_service),
):
    """Register a new card with an initial balance."""
    return service.register_card(card_in)


@router.post("/verify")
def verify_card(
    verify_in: CardVerify,
    service: CardService = Depends(get_card_service),
):
    """Verify that the card details are correct."""
    is_valid = service.verify_card(verify_in)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid card details",
        )
    return {"status": "valid"}


@router.post("/pay", response_model=CardResponse)
def process_payment(
    payment_in: PaymentRequest,
    service: CardService = Depends(get_card_service),
):
    """Authorize and process a card payment."""
    return service.process_payment(payment_in)


@router.post("/topup", response_model=CardResponse)
def top_up_balance(
    top_up_in: TopUpRequest,
    service: CardService = Depends(get_card_service),
):
    """Top up the card balance."""
    return service.top_up_balance(top_up_in)


@router.get("/{card_number}", response_model=CardResponse)
def get_card_details(
    card_number: str,
    service: CardService = Depends(get_card_service),
):
    """Retrieve card details including the current balance."""
    return service.get_card(card_number)
