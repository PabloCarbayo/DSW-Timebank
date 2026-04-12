from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.service_request import ServiceRequest


class ServiceRequestRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, request_id: int) -> Optional[ServiceRequest]:
        return self.db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()

    def get_by_requester(self, requester_id: int) -> List[ServiceRequest]:
        return (
            self.db.query(ServiceRequest)
            .filter(ServiceRequest.requester_id == requester_id)
            .order_by(ServiceRequest.created_at.desc())
            .all()
        )

    def get_by_provider(self, provider_id: int) -> List[ServiceRequest]:
        return (
            self.db.query(ServiceRequest)
            .filter(ServiceRequest.provider_id == provider_id)
            .order_by(ServiceRequest.created_at.desc())
            .all()
        )

    def create(self, service_request: ServiceRequest) -> ServiceRequest:
        self.db.add(service_request)
        self.db.commit()
        self.db.refresh(service_request)
        return service_request

    def update(self, service_request: ServiceRequest) -> ServiceRequest:
        self.db.commit()
        self.db.refresh(service_request)
        return service_request
