from sqlalchemy import Column, Integer, Numeric, String

from app.database import Base


class CreditCard(Base):
    """SQLAlchemy model representing a registered credit card."""

    __tablename__ = "credit_cards"

    id = Column(Integer, primary_key=True, index=True)
    cardholder_name = Column(String(100), index=True, nullable=False)
    card_number = Column(String(19), unique=True, index=True, nullable=False)
    expiration_date = Column(String(5), nullable=False)  # Format: MM/YY
    cvc = Column(String(4), nullable=False)
    balance = Column(Numeric(precision=12, scale=2), default=0.0, nullable=False)
