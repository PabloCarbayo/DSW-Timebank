from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.card import CreditCard
from app.schemas.card import CardCreate, PaymentRequest, TopUpRequest, CardVerify
from app.repositories.card_repository import CardRepository

class CardService:
    def __init__(self, db: Session):
        self.repository = CardRepository(db)

    def register_card(self, card_in: CardCreate) -> CreditCard:
        if self.repository.get_by_card_number(card_in.card_number):
            raise HTTPException(status_code=400, detail="Card already registered")
        
        card = CreditCard(
            cardholder_name=card_in.cardholder_name,
            card_number=card_in.card_number,
            expiration_date=card_in.expiration_date,
            cvc=card_in.cvc,
            balance=card_in.initial_balance
        )
        return self.repository.create(card)

    def verify_card(self, verify_in: CardVerify) -> bool:
        card = self.repository.get_by_card_number(verify_in.card_number)
        if not card:
            return False
        if card.expiration_date != verify_in.expiration_date or card.cvc != verify_in.cvc:
            return False
        return True

    def top_up_balance(self, top_up_in: TopUpRequest) -> CreditCard:
        verify_data = CardVerify(
            card_number=top_up_in.card_number, 
            expiration_date=top_up_in.expiration_date, 
            cvc=top_up_in.cvc
        )
        if not self.verify_card(verify_data):
            raise HTTPException(status_code=401, detail="Invalid card details")

        card = self.repository.get_by_card_number(top_up_in.card_number)
        card.balance += top_up_in.amount
        return self.repository.update(card)

    def process_payment(self, payment_in: PaymentRequest) -> CreditCard:
        verify_data = CardVerify(
            card_number=payment_in.card_number, 
            expiration_date=payment_in.expiration_date, 
            cvc=payment_in.cvc
        )
        if not self.verify_card(verify_data):
            raise HTTPException(status_code=401, detail="Invalid card details")

        card = self.repository.get_by_card_number(payment_in.card_number)
        if card.balance < payment_in.amount:
            raise HTTPException(status_code=402, detail="Insufficient funds")

        card.balance -= payment_in.amount
        return self.repository.update(card)
    
    def get_card(self, card_number: str) -> CreditCard:
        card = self.repository.get_by_card_number(card_number)
        if not card:
            raise HTTPException(status_code=404, detail="Card not found")
        return card
