from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.jwt_handler import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.service import ServiceCreate, ServiceListResponse, ServiceResponse, ServiceUpdate
from app.services.service_service import ServiceService

router = APIRouter(prefix="/api/v1/services", tags=["Services"])


def get_service_service(db: Session = Depends(get_db)) -> ServiceService:
    return ServiceService(db)


@router.post("/", response_model=ServiceResponse)
def create_service(
    data: ServiceCreate,
    current_user: User = Depends(get_current_user),
    service: ServiceService = Depends(get_service_service),
):
    """Create a new service listing."""
    return service.create_service(current_user.id, data)


@router.get("/", response_model=ServiceListResponse)
def list_services(
    category: Optional[str] = Query(None, description="Filter by category"),
    keyword: Optional[str] = Query(None, description="Search in title and description"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    service: ServiceService = Depends(get_service_service),
):
    """List and search active services. Public endpoint."""
    return service.list_services(
        category=category,
        keyword=keyword,
        page=page,
        page_size=page_size,
    )


@router.get("/me", response_model=List[ServiceResponse])
def get_my_services(
    current_user: User = Depends(get_current_user),
    service: ServiceService = Depends(get_service_service),
):
    """List all services created by the authenticated user."""
    return service.get_my_services(current_user.id)


@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(
    service_id: int,
    service: ServiceService = Depends(get_service_service),
):
    """Get details of a specific service. Public endpoint."""
    return service.get_service(service_id)


@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: int,
    data: ServiceUpdate,
    current_user: User = Depends(get_current_user),
    service: ServiceService = Depends(get_service_service),
):
    """Update a service. Only the service owner can modify it."""
    return service.update_service(current_user.id, service_id, data)


@router.delete("/{service_id}")
def delete_service(
    service_id: int,
    current_user: User = Depends(get_current_user),
    service: ServiceService = Depends(get_service_service),
):
    """Delete a service. Only the service owner can delete it."""
    service.delete_service(current_user.id, service_id)
    return {"message": "Service deleted successfully"}
