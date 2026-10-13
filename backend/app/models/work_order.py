import uuid

from sqlalchemy import Column, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql.sqltypes import TIMESTAMP

from app.database import Base


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    vehicle_id = Column(
        UUID(as_uuid=True),
        nullable=False,
    )
    depot_id = Column(
        UUID(as_uuid=True),
        nullable=False,
    )
    assigned_technician_id = Column(
        UUID(as_uuid=True),
        nullable=True,
    )
    raised_by_user_id = Column(
        UUID(as_uuid=True),
        nullable=False,
    )
    closed_by_user_id = Column(
        UUID(as_uuid=True),
        nullable=True,
    )
    status = Column(String(30), nullable=False, default="open", server_default="open")
    description = Column(Text, nullable=True)
    completion_notes = Column(Text, nullable=True)
    post_service_odometer_km = Column(Numeric(10, 1), nullable=True)
    post_service_reading_id = Column(
        UUID(as_uuid=True),
        nullable=True,
    )
    raised_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    closed_at = Column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )
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
    vehicle = relationship(
        "Vehicle",
        back_populates="work_orders",
        lazy="select",
        foreign_keys=[vehicle_id],
    )
    depot = relationship(
        "Depot",
        back_populates="work_orders",
        lazy="select",
        foreign_keys=[depot_id],
    )
    assigned_technician = relationship(
        "User",
        back_populates="work_orders_assigned",
        lazy="select",
        foreign_keys=[assigned_technician_id],
    )
    raised_by_user = relationship(
        "User",
        back_populates="work_orders_raised",
        lazy="select",
        foreign_keys=[raised_by_user_id],
    )
    closed_by_user = relationship(
        "User",
        back_populates="work_orders_closed",
        lazy="select",
        foreign_keys=[closed_by_user_id],
    )
    post_service_reading = relationship(
        "Reading",
        back_populates="work_orders",
        lazy="select",
        foreign_keys=[post_service_reading_id],
    )

    def __repr__(self) -> str:
        return (
            f"<WorkOrder id={self.id!r} vehicle_id={self.vehicle_id!r} "
            f"depot_id={self.depot_id!r} status={self.status!r}>"
        )
