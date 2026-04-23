from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.auth.password import hash_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import AdminUserUpdate, UserUpdate


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

    # ── Admin operations ──────────────────────────────

    def list_users(self) -> List[User]:
        """Return all registered users (admin only)."""
        return self.repository.get_all()

    def admin_update_user(self, admin_id: int, user_id: int, data: AdminUserUpdate) -> User:
        """Update user role or active status. Admins cannot deactivate themselves."""
        user = self.repository.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        if admin_id == user_id and data.is_active is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admins cannot deactivate their own account",
            )

        if data.role is not None:
            user.role = data.role
        if data.is_active is not None:
            user.is_active = data.is_active

        return self.repository.update(user)

    def delete_user(self, admin_id: int, user_id: int) -> None:
        """Delete a user account. Admins cannot delete themselves."""
        if admin_id == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admins cannot delete their own account",
            )

        user = self.repository.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        self.repository.delete(user)

