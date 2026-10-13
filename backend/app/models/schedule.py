import uuid

from sqlalchemy import Boolean, Column, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql.sqltypes import TIMESTAMP

from app.database import Base


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    vehicle_type_id = Column(
        UUID(as_uuid=True),
        nullable=False,
    )
    vehicle_class = Column(String(50), nullable=False)
    km_interval = Column(Integer, nullable=False)
    month_interval = Column(Integer, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True, server_default="true")
    created_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    vehicle_type = relationship("VehicleType", back_populates="schedules", lazy="select")

    def __repr__(self) -> str:
        return (
            f"<Schedule id={self.id!r} vehicle_class={self.vehicle_class!r} "
            f"km_interval={self.km_interval!r} month_interval={self.month_interval!r} "
            f"is_active={self.is_active!r}>"
        )
