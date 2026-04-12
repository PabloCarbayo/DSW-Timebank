import os
from typing import List

import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.transaction import Transaction, TransactionType
from app.repositories.transaction_repository import TransactionRepository
from app.repositories.user_repository import UserRepository

PAYMENT_GATEWAY_URL = os.getenv("PAYMENT_GATEWAY_URL", "http://localhost:8001")


class TransactionService:
    def __init__(self, db: Session):
        self.db = db
        self.transaction_repository = TransactionRepository(db)
        self.user_repository = UserRepository(db)

    def get_user_transactions(self, user_id: int) -> List[Transaction]:
        """Return the full transaction history for a user."""
        return self.transaction_repository.get_by_user(user_id)

    def purchase_credits(
        self,
        user_id: int,
        card_number: str,
        expiration_date: str,
        cvc: str,
        amount: float,
    ) -> Transaction:
        """Purchase time credits by charging the payment gateway.
        On success, credits the user balance and records the transaction."""
        payment_response = httpx.post(
            f"{PAYMENT_GATEWAY_URL}/api/v1/cards/pay",
            json={
                "card_number": card_number,
                "expiration_date": expiration_date,
                "cvc": cvc,
                "amount": amount,
            },
            timeout=10.0,
        )

        if payment_response.status_code == 401:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid card details",
            )
        if payment_response.status_code == 402:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient card funds",
            )
        if payment_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Payment gateway error",
            )

        user = self.user_repository.get_by_id(user_id)
        user.balance += amount
        self.user_repository.update(user)

        transaction = Transaction(
            sender_id=None,
            receiver_id=user_id,
            amount=amount,
            transaction_type=TransactionType.CREDIT_PURCHASE,
            description=f"Purchased {amount} time credits via card ending in {card_number[-4:]}",
        )
        return self.transaction_repository.create(transaction)

    def transfer_credits(self, sender_id: int, receiver_id: int, amount: float) -> Transaction:
        """Transfer time credits from one user to another."""
        if sender_id == receiver_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot transfer credits to yourself",
            )

        sender = self.user_repository.get_by_id(sender_id)
        receiver = self.user_repository.get_by_id(receiver_id)

        if not receiver:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Receiver user not found",
            )

        if sender.balance < amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient time credits",
            )

        sender.balance -= amount
        receiver.balance += amount
        self.user_repository.update(sender)
        self.user_repository.update(receiver)

        transaction = Transaction(
            sender_id=sender_id,
            receiver_id=receiver_id,
            amount=amount,
            transaction_type=TransactionType.CREDIT_TRANSFER,
            description=f"Transfer of {amount} credits to user {receiver.first_name} {receiver.last_name}",
        )
        return self.transaction_repository.create(transaction)
