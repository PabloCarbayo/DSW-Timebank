from typing import List

from sqlalchemy.orm import Session

from app.models.transaction import Transaction


class TransactionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_user(self, user_id: int) -> List[Transaction]:
        """Return all transactions where the user is sender or receiver, newest first."""
        from sqlalchemy.orm import joinedload
        return (
            self.db.query(Transaction)
            .options(joinedload(Transaction.sender), joinedload(Transaction.receiver))
            .filter(
                (Transaction.sender_id == user_id)
                | (Transaction.receiver_id == user_id)
            )
            .order_by(Transaction.created_at.desc())
            .all()
        )

    def get_all(self) -> List[Transaction]:
        """Return all transactions, newest first."""
        from sqlalchemy.orm import joinedload
        return (
            self.db.query(Transaction)
            .options(joinedload(Transaction.sender), joinedload(Transaction.receiver))
            .order_by(Transaction.created_at.desc())
            .all()
        )

    def create(self, transaction: Transaction) -> Transaction:
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        return transaction
