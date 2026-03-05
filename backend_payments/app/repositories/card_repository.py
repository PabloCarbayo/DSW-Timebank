from sqlalchemy.orm import Session
from app.models.card import CreditCard

class CardRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_card_number(self, card_number: str) -> CreditCard | None:
        return self.db.query(CreditCard).filter(CreditCard.card_number == card_number).first()

    def create(self, card: CreditCard) -> CreditCard:
        self.db.add(card)
        self.db.commit()
        self.db.refresh(card)
        return card

    def update(self, card: CreditCard) -> CreditCard:
        self.db.commit()
        self.db.refresh(card)
        return card
