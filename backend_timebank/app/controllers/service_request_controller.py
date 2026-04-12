from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.jwt_handler import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.service_request import ServiceRequestCreate, ServiceRequestResponse
from app.services.service_request_service import ServiceRequestService

router = APIRouter(prefix="/api/v1/requests", tags=["Service Requests"])


def get_request_service(db: Session = Depends(get_db)) -> ServiceRequestService:
    return ServiceRequestService(db)


@router.post("/", response_model=ServiceRequestResponse)
def create_request(
    data: ServiceRequestCreate,
    current_user: User = Depends(get_current_user),
    service: ServiceRequestService = Depends(get_request_service),
):
    """Create a new service request."""
    return service.create_request(current_user.id, data.service_id)


@router.get("/incoming", response_model=List[ServiceRequestResponse])
def get_incoming_requests(
    current_user: User = Depends(get_current_user),
    service: ServiceRequestService = Depends(get_request_service),
):
    """List all service requests received as a provider."""
    return service.get_incoming_requests(current_user.id)


@router.get("/outgoing", response_model=List[ServiceRequestResponse])
def get_outgoing_requests(
    current_user: User = Depends(get_current_user),
    service: ServiceRequestService = Depends(get_request_service),
):
    """List all service requests sent as a requester."""
    return service.get_outgoing_requests(current_user.id)


@router.patch("/{request_id}/accept", response_model=ServiceRequestResponse)
def accept_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    service: ServiceRequestService = Depends(get_request_service),
):
    """Accept a pending service request (provider only)."""
    return service.accept_request(current_user.id, request_id)


@router.patch("/{request_id}/reject", response_model=ServiceRequestResponse)
def reject_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    service: ServiceRequestService = Depends(get_request_service),
):
    """Reject a pending service request (provider only)."""
    return service.reject_request(current_user.id, request_id)


@router.patch("/{request_id}/cancel", response_model=ServiceRequestResponse)
def cancel_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    service: ServiceRequestService = Depends(get_request_service),
):
    """Cancel a service request (requester only, from pending or accepted)."""
    return service.cancel_request(current_user.id, request_id)


@router.patch("/{request_id}/complete", response_model=ServiceRequestResponse)
def complete_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    service: ServiceRequestService = Depends(get_request_service),
):
    """Complete a service request and trigger the time credit transfer (provider only)."""
    return service.complete_request(current_user.id, request_id)
