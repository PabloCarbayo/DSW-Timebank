from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import ForgotPasswordRequest, ResetPasswordRequest
from app.schemas.user import TokenResponse, UserLogin, UserRegister, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


@router.post("/register", response_model=UserResponse)
def register(
    user_in: UserRegister,
    service: AuthService = Depends(get_auth_service),
):
    """Register a new user on the platform."""
    return service.register(user_in)


@router.post("/login", response_model=TokenResponse)
def login(
    credentials: UserLogin,
    response: Response,
    service: AuthService = Depends(get_auth_service),
):
    """Log in and obtain a JWT token."""
    token = service.login(credentials)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=3600
    )
    return TokenResponse(access_token=token)


@router.post("/logout")
def logout(response: Response):
    """Log out. In stateless JWT, the client discards the token."""
    response.delete_cookie(
        key="access_token",
        secure=True,
        httponly=True,
        samesite="lax"
    )
    return {"message": "Successfully logged out"}


@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    service: AuthService = Depends(get_auth_service),
):
    """Request a password reset link."""
    service.forgot_password(request)
    return {"message": "If that email exists, a password reset link has been sent."}


@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    service: AuthService = Depends(get_auth_service),
):
    """Reset password using a token."""
    service.reset_password(request)
    return {"message": "Password successfully reset."}
