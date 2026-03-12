from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.auth.password import hash_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserUpdate


class UserService:
    def __init__(self, db: Session):
        self.repository = UserRepository(db)

    def get_profile(self, user_id: int) -> User:
        """Get user profile by ID. Raises 404 if not found."""
        user = self.repository.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return user

    def update_profile(self, user_id: int, data: UserUpdate) -> User:
        """Update user profile fields. Only updates provided (non-None) fields."""
        user = self.repository.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        if data.first_name is not None:
            user.first_name = data.first_name
        if data.last_name is not None:
            user.last_name = data.last_name
        if data.password is not None:
            user.hashed_password = hash_password(data.password)

        return self.repository.update(user)
