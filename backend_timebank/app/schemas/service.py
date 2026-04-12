from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ServiceCreate(BaseModel):
    """Schema for creating a new service."""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    category: str = Field(..., min_length=1, max_length=100)
    price: float = Field(..., gt=0)


class ServiceUpdate(BaseModel):
    """Schema for updating a service. All fields are optional."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[float] = Field(None, gt=0)
    is_active: Optional[bool] = None


class ServiceProviderInfo(BaseModel):
    """Minimal provider info embedded in service responses."""
    id: int
    first_name: str
    last_name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class ServiceResponse(BaseModel):
    """Schema for service data in API responses."""
    id: int
    title: str
    description: Optional[str]
    category: str
    price: float
    provider_id: int
    provider: ServiceProviderInfo
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ServiceListResponse(BaseModel):
    """Schema for paginated service list responses."""
    items: List[ServiceResponse]
    total: int
    page: int
    page_size: int
