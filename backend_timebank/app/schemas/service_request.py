from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ServiceRequestCreate(BaseModel):
    """Schema for creating a service request."""
    service_id: int


class ServiceRequestResponse(BaseModel):
    """Schema for service request data in API responses."""
    id: int
    service_id: int
    requester_id: int
    provider_id: int
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
