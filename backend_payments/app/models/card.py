from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class CreditCard(Base):
    __tablename__ = "credit_cards"

    id = Column(Integer, primary_key=True, index=True)
    cardholder_name = Column(String(100), index=True)
    card_number = Column(String(19), unique=True, index=True)
    expiration_date = Column(String(5))  # Format MM/YY
    cvc = Column(String(4))
    balance = Column(Float, default=0.0)
