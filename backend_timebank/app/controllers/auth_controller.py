from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
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
    """
    Registrar un nuevo usuario en la plataforma.
    """
    return service.register(user_in)


@router.post("/login", response_model=TokenResponse)
def login(
    credentials: UserLogin,
    service: AuthService = Depends(get_auth_service),
):
    """
    Iniciar sesión y obtener un token JWT.
    """
    token = service.login(credentials)
    return TokenResponse(access_token=token)


@router.post("/logout")
def logout():
    """
    Cerrar sesión. En JWT stateless, el cliente elimina el token.
    """
    return {"message": "Successfully logged out"}
