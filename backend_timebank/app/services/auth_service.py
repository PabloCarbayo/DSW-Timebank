from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.auth.jwt_handler import create_access_token
from app.auth.password import hash_password, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserLogin, UserRegister


class AuthService:
    def __init__(self, db: Session):
        self.repository = UserRepository(db)

    def register(self, user_in: UserRegister) -> User:
        """Register a new user. Raises 400 if email is already taken."""
        if self.repository.get_by_email(user_in.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        user = User(
            email=user_in.email,
            hashed_password=hash_password(user_in.password),
            first_name=user_in.first_name,
            last_name=user_in.last_name,
        )
        return self.repository.create(user)

    def login(self, credentials: UserLogin) -> str:
        """Authenticate user and return a JWT access token. Raises 401 on failure."""
        user = self.repository.get_by_email(credentials.email)
        if not user or not verify_password(credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user account",
            )

        access_token = create_access_token(data={"sub": str(user.id)})
        return access_token
