import uuid

from sqlalchemy import Column, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql.sqltypes import TIMESTAMP

from app.database import Base


class VehicleType(Base):
    __tablename__ = "vehicle_types"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    name = Column(String(100), nullable=False, unique=True)
    vehicle_class = Column(String(50), nullable=False)
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
    schedules = relationship("Schedule", back_populates="vehicle_type", lazy="select")
    vehicles = relationship("Vehicle", back_populates="vehicle_type", lazy="select")

    def __repr__(self) -> str:
        return f"<VehicleType id={self.id!r} name={self.name!r} vehicle_class={self.vehicle_class!r}>"
