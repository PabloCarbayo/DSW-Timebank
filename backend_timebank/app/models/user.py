from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(String(20), default="user", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    balance = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    services = relationship("Service", back_populates="provider", cascade="all, delete-orphan")
    sent_requests = relationship(
        "ServiceRequest", foreign_keys="ServiceRequest.requester_id", back_populates="requester",
    )
    received_requests = relationship(
        "ServiceRequest", foreign_keys="ServiceRequest.provider_id", back_populates="provider",
    )
    sent_transactions = relationship(
        "Transaction", foreign_keys="Transaction.sender_id", back_populates="sender",
    )
    received_transactions = relationship(
        "Transaction", foreign_keys="Transaction.receiver_id", back_populates="receiver",
    )
