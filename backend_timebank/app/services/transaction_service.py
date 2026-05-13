import os
from typing import List

import stripe
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.transaction import Transaction, TransactionType
from app.repositories.transaction_repository import TransactionRepository
from app.repositories.user_repository import UserRepository


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


FRONTEND_URL = _require_env("FRONTEND_URL")
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

class TransactionService:
    def __init__(self, db: Session):
        self.db = db
        self.transaction_repository = TransactionRepository(db)
        self.user_repository = UserRepository(db)

    def get_user_transactions(self, user_id: int) -> List[Transaction]:
        """Return the full transaction history for a user."""
        return self.transaction_repository.get_by_user(user_id)

    def get_all_transactions(self) -> List[Transaction]:
        """Return all transactions in the system (Admin only)."""
        return self.transaction_repository.get_all()

    def purchase_credits(self, user_id: int, amount: float) -> str:
        """Create a Stripe Checkout Session to purchase time credits.
        Returns the Stripe Checkout URL."""
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[
                    {
                        "price_data": {
                            "currency": "eur",
                            "product_data": {
                                "name": "Time Credits",
                                "description": f"{amount} time credits",
                            },
                            "unit_amount": int(amount * 100),  # Amount in cents
                        },
                        "quantity": 1,
                    }
                ],
                mode="payment",
                success_url=f"{FRONTEND_URL}/payment-success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{FRONTEND_URL}/payment-cancelled",
                client_reference_id=str(user_id),
                metadata={"amount": amount},
            )
            return session.url
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(e),
            )

    def process_stripe_webhook(self, payload: bytes, sig_header: str):
        """Process the Stripe webhook event."""
        if not STRIPE_WEBHOOK_SECRET:
            raise HTTPException(status_code=500, detail="Stripe webhook secret not configured")

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
        except ValueError as e:
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            raise HTTPException(status_code=400, detail="Invalid signature")

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            user_id = int(session.get("client_reference_id"))
            amount = float(session.get("metadata").get("amount"))

            user = self.user_repository.get_by_id(user_id)
            if user:
                user.balance += amount
                self.user_repository.update(user)

                transaction = Transaction(
                    sender_id=None,
                    receiver_id=user_id,
                    amount=amount,
                    transaction_type=TransactionType.CREDIT_PURCHASE,
                    description=f"Purchased {amount} time credits via Stripe",
                )
                self.transaction_repository.create(transaction)

        return {"status": "success"}

    def transfer_credits(
        self,
        sender_id: int,
        amount: float,
        receiver_id: int | None = None,
        receiver_email: str | None = None,
    ) -> Transaction:
        """Transfer time credits from one user to another."""
        sender = self.user_repository.get_by_id(sender_id)

        if receiver_id is not None:
            receiver = self.user_repository.get_by_id(receiver_id)
        else:
            receiver = self.user_repository.get_by_email((receiver_email or "").lower())

        if not receiver:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Receiver user not found",
            )

        if sender_id == receiver.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot transfer credits to yourself",
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
            receiver_id=receiver.id,
            amount=amount,
            transaction_type=TransactionType.CREDIT_TRANSFER,
            description=f"Transfer of {amount} credits to user {receiver.first_name} {receiver.last_name}",
        )
        return self.transaction_repository.create(transaction)
