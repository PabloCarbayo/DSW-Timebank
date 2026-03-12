from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.card import CreditCard
from app.repositories.card_repository import CardRepository
from app.schemas.card import CardCreate, CardVerify, PaymentRequest, TopUpRequest


class CardService:
    """Service layer for credit card operations."""

    def __init__(self, db: Session):
        self._repository = CardRepository(db)

    def register_card(self, card_in: CardCreate) -> CreditCard:
        """Register a new credit card. Raises 400 if card number already exists."""
        if self._repository.get_by_card_number(card_in.card_number):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Card already registered",
            )

        card = CreditCard(
            cardholder_name=card_in.cardholder_name,
            card_number=card_in.card_number,
            expiration_date=card_in.expiration_date,
            cvc=card_in.cvc,
            balance=card_in.initial_balance,
        )
        return self._repository.create(card)

    def verify_card(self, verify_in: CardVerify) -> bool:
        """Check whether the provided card details match a registered card."""
        card = self._repository.get_by_card_number(verify_in.card_number)
        if not card:
            return False
        return (
            card.expiration_date == verify_in.expiration_date
            and card.cvc == verify_in.cvc
        )

    def top_up_balance(self, top_up_in: TopUpRequest) -> CreditCard:
        """Add funds to a card. Raises 401 if card details are invalid."""
        card = self._get_verified_card(
            card_number=top_up_in.card_number,
            expiration_date=top_up_in.expiration_date,
            cvc=top_up_in.cvc,
        )
        card.balance += top_up_in.amount
        return self._repository.update(card)

    def process_payment(self, payment_in: PaymentRequest) -> CreditCard:
        """Process a payment. Raises 401 if invalid or 402 if insufficient funds."""
        card = self._get_verified_card(
            card_number=payment_in.card_number,
            expiration_date=payment_in.expiration_date,
            cvc=payment_in.cvc,
        )
        if card.balance < payment_in.amount:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Insufficient funds",
            )
        card.balance -= payment_in.amount
        return self._repository.update(card)

    def get_card(self, card_number: str) -> CreditCard:
        """Retrieve card details by card number. Raises 404 if not found."""
        card = self._repository.get_by_card_number(card_number)
        if not card:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Card not found",
            )
        return card

    def _get_verified_card(
        self, card_number: str, expiration_date: str, cvc: str
    ) -> CreditCard:
        """Verify card details and return the card. Raises 401 if invalid."""
        verify_data = CardVerify(
            card_number=card_number,
            expiration_date=expiration_date,
            cvc=cvc,
        )
        if not self.verify_card(verify_data):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid card details",
            )
        return self._repository.get_by_card_number(card_number)
