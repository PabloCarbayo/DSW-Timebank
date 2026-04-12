from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.service import Service
from app.repositories.service_repository import ServiceRepository
from app.schemas.service import ServiceCreate, ServiceListResponse, ServiceResponse, ServiceUpdate


class ServiceService:
    def __init__(self, db: Session):
        self.repository = ServiceRepository(db)

    def create_service(self, provider_id: int, data: ServiceCreate) -> Service:
        """Create a new service listing for the given provider."""
        service = Service(
            title=data.title,
            description=data.description,
            category=data.category,
            price=data.price,
            provider_id=provider_id,
        )
        return self.repository.create(service)

    def get_service(self, service_id: int) -> Service:
        """Get a single service by ID. Raises 404 if not found."""
        service = self.repository.get_by_id(service_id)
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found",
            )
        return service

    def list_services(
        self,
        category: Optional[str] = None,
        keyword: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> ServiceListResponse:
        """Return a filtered, paginated list of active services."""
        items, total = self.repository.get_all(
            category=category,
            keyword=keyword,
            page=page,
            page_size=page_size,
        )
        return ServiceListResponse(
            items=[ServiceResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get_my_services(self, provider_id: int) -> List[Service]:
        """Return all services created by the given provider."""
        return self.repository.get_by_provider(provider_id)

    def update_service(self, user_id: int, service_id: int, data: ServiceUpdate) -> Service:
        """Update a service. Only the service owner can modify it."""
        service = self.get_service(service_id)
        self._assert_owner(user_id, service)

        if data.title is not None:
            service.title = data.title
        if data.description is not None:
            service.description = data.description
        if data.category is not None:
            service.category = data.category
        if data.price is not None:
            service.price = data.price
        if data.is_active is not None:
            service.is_active = data.is_active

        return self.repository.update(service)

    def delete_service(self, user_id: int, service_id: int) -> None:
        """Delete a service. Only the service owner can delete it."""
        service = self.get_service(service_id)
        self._assert_owner(user_id, service)
        self.repository.delete(service)

    def _assert_owner(self, user_id: int, service: Service) -> None:
        """Raise 403 if the user is not the service owner."""
        if service.provider_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the service owner can perform this action",
            )
