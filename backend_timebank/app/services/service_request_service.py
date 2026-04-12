from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.service_request import RequestStatus, ServiceRequest
from app.models.transaction import Transaction, TransactionType
from app.repositories.service_repository import ServiceRepository
from app.repositories.service_request_repository import ServiceRequestRepository
from app.repositories.transaction_repository import TransactionRepository
from app.repositories.user_repository import UserRepository


class ServiceRequestService:
    def __init__(self, db: Session):
        self.db = db
        self.request_repository = ServiceRequestRepository(db)
        self.service_repository = ServiceRepository(db)
        self.user_repository = UserRepository(db)
        self.transaction_repository = TransactionRepository(db)

    def create_request(self, requester_id: int, service_id: int) -> ServiceRequest:
        """Create a new service request. Validates the service exists, is active,
        and the requester is not the service provider."""
        service = self.service_repository.get_by_id(service_id)
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found",
            )
        if not service.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Service is not currently active",
            )
        if service.provider_id == requester_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot request your own service",
            )

        requester = self.user_repository.get_by_id(requester_id)
        if requester.balance < service.price:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient time credits",
            )

        service_request = ServiceRequest(
            service_id=service.id,
            requester_id=requester_id,
            provider_id=service.provider_id,
            status=RequestStatus.PENDING,
        )
        return self.request_repository.create(service_request)

    def accept_request(self, provider_id: int, request_id: int) -> ServiceRequest:
        """Accept a pending service request. Only the provider can accept."""
        service_request = self._get_request_for_provider(provider_id, request_id)
        self._assert_status(service_request, RequestStatus.PENDING)

        service_request.status = RequestStatus.ACCEPTED
        return self.request_repository.update(service_request)

    def reject_request(self, provider_id: int, request_id: int) -> ServiceRequest:
        """Reject a pending service request. Only the provider can reject."""
        service_request = self._get_request_for_provider(provider_id, request_id)
        self._assert_status(service_request, RequestStatus.PENDING)

        service_request.status = RequestStatus.REJECTED
        return self.request_repository.update(service_request)

    def cancel_request(self, requester_id: int, request_id: int) -> ServiceRequest:
        """Cancel a service request. Only the requester can cancel,
        and only while the request is pending or accepted."""
        service_request = self._get_request_for_requester(requester_id, request_id)
        allowed_statuses = {RequestStatus.PENDING, RequestStatus.ACCEPTED}
        if service_request.status not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel a request with status '{service_request.status}'",
            )

        service_request.status = RequestStatus.CANCELLED
        return self.request_repository.update(service_request)

    def complete_request(self, provider_id: int, request_id: int) -> ServiceRequest:
        """Complete an accepted service request. Transfers time credits
        from the requester to the provider and records the transaction."""
        service_request = self._get_request_for_provider(provider_id, request_id)
        self._assert_status(service_request, RequestStatus.ACCEPTED)

        service = self.service_repository.get_by_id(service_request.service_id)
        requester = self.user_repository.get_by_id(service_request.requester_id)
        provider = self.user_repository.get_by_id(service_request.provider_id)

        if requester.balance < service.price:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Requester has insufficient time credits",
            )

        requester.balance -= service.price
        provider.balance += service.price

        transaction = Transaction(
            sender_id=requester.id,
            receiver_id=provider.id,
            amount=service.price,
            transaction_type=TransactionType.SERVICE_PAYMENT,
            service_request_id=service_request.id,
            description=f"Payment for service: {service.title}",
        )
        self.transaction_repository.create(transaction)

        service_request.status = RequestStatus.COMPLETED
        return self.request_repository.update(service_request)

    def get_incoming_requests(self, provider_id: int) -> List[ServiceRequest]:
        """Return all requests received by the provider."""
        return self.request_repository.get_by_provider(provider_id)

    def get_outgoing_requests(self, requester_id: int) -> List[ServiceRequest]:
        """Return all requests sent by the requester."""
        return self.request_repository.get_by_requester(requester_id)

    # ── Private helpers ───────────────────────────────

    def _get_request_for_provider(self, provider_id: int, request_id: int) -> ServiceRequest:
        """Fetch and validate that the request belongs to this provider."""
        service_request = self.request_repository.get_by_id(request_id)
        if not service_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service request not found",
            )
        if service_request.provider_id != provider_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the service provider can perform this action",
            )
        return service_request

    def _get_request_for_requester(self, requester_id: int, request_id: int) -> ServiceRequest:
        """Fetch and validate that the request belongs to this requester."""
        service_request = self.request_repository.get_by_id(request_id)
        if not service_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service request not found",
            )
        if service_request.requester_id != requester_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the requester can perform this action",
            )
        return service_request

    def _assert_status(self, service_request: ServiceRequest, expected: str) -> None:
        """Raise 400 if the request is not in the expected status."""
        if service_request.status != expected:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Request must be in '{expected}' status, currently '{service_request.status}'",
            )
