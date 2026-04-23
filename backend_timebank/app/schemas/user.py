from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegister(BaseModel):
    """Schema for user registration request."""
    email: EmailStr
    password: str = Field(..., min_length=6)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)


class UserLogin(BaseModel):
    """Schema for user login request."""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Schema for updating user profile. All fields are optional."""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    password: Optional[str] = Field(None, min_length=6)


class AdminUserUpdate(BaseModel):
    """Schema for admin-level user updates (role, active status)."""
    role: Optional[str] = Field(None, pattern=r"^(user|admin)$")
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    """Schema for user data in API responses."""
    id: int
    email: str
    first_name: str
    last_name: str
    role: str
    is_active: bool
    balance: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """Schema for JWT token response after login."""
    access_token: str
    token_type: str = "bearer"

