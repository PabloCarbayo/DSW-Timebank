from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, index=True)
    price = Column(Float, nullable=False)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    provider = relationship("User", back_populates="services")
    requests = relationship("ServiceRequest", back_populates="service", cascade="all, delete-orphan")

    @property
    def average_rating(self) -> float | None:
        completed_requests = [r for r in self.requests if r.status == "completed" and r.rating is not None]
        if not completed_requests:
            return None
        return round(sum(r.rating for r in completed_requests) / len(completed_requests), 1)

    @property
    def review_count(self) -> int:
        return len([r for r in self.requests if r.status == "completed" and r.rating is not None])
