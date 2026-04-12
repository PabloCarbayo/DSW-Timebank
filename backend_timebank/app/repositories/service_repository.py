from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.service import Service


class ServiceRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, service_id: int) -> Optional[Service]:
        return self.db.query(Service).filter(Service.id == service_id).first()

    def get_by_provider(self, provider_id: int) -> List[Service]:
        return (
            self.db.query(Service)
            .filter(Service.provider_id == provider_id)
            .order_by(Service.created_at.desc())
            .all()
        )

    def get_all(
        self,
        category: Optional[str] = None,
        keyword: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[Service], int]:
        """Return a filtered, paginated list of active services and total count."""
        query = self.db.query(Service).filter(Service.is_active.is_(True))

        if category:
            query = query.filter(Service.category.ilike(f"%{category}%"))
        if keyword:
            query = query.filter(
                (Service.title.ilike(f"%{keyword}%"))
                | (Service.description.ilike(f"%{keyword}%"))
            )

        total = query.count()
        items = (
            query.order_by(Service.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return items, total

    def create(self, service: Service) -> Service:
        self.db.add(service)
        self.db.commit()
        self.db.refresh(service)
        return service

    def update(self, service: Service) -> Service:
        self.db.commit()
        self.db.refresh(service)
        return service

    def delete(self, service: Service) -> None:
        self.db.delete(service)
        self.db.commit()
