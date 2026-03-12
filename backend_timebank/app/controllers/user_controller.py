from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.jwt_handler import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
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
