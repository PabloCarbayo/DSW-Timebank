from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.jwt_handler import get_current_admin, get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.user import AdminUserUpdate, UserResponse, UserUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/api/v1/users", tags=["Users"])


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)


@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    """Retrieve the authenticated user's profile."""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_my_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    """Update the authenticated user's profile data."""
    return service.update_profile(current_user.id, data)


# ── Admin endpoints ──────────────────────────────


@router.get("/", response_model=List[UserResponse])
def list_users(
    admin: User = Depends(get_current_admin),
    service: UserService = Depends(get_user_service),
):
    """List all registered users (admin only)."""
    return service.list_users()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    admin: User = Depends(get_current_admin),
    service: UserService = Depends(get_user_service),
):
    """Get a specific user by ID (admin only)."""
    return service.get_profile(user_id)


@router.put("/{user_id}", response_model=UserResponse)
def admin_update_user(
    user_id: int,
    data: AdminUserUpdate,
    admin: User = Depends(get_current_admin),
    service: UserService = Depends(get_user_service),
):
    """Update a user's role or active status (admin only)."""
    return service.admin_update_user(admin.id, user_id, data)


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    admin: User = Depends(get_current_admin),
    service: UserService = Depends(get_user_service),
):
    """Delete a user account (admin only)."""
    service.delete_user(admin.id, user_id)
    return {"message": "User deleted successfully"}

