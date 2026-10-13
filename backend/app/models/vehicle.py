import uuid

from sqlalchemy import Boolean, Column, Date, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql.sqltypes import TIMESTAMP

from app.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    depot_id = Column(
        UUID(as_uuid=True),
        nullable=False,
    )
    vehicle_type_id = Column(
        UUID(as_uuid=True),
        nullable=False,
    )
    registration_number = Column(String(20), nullable=False, unique=True)
    make = Column(String(100), nullable=False)
    model = Column(String(100), nullable=False)
    in_service_date = Column(Date, nullable=False)
    has_telematics = Column(Boolean, nullable=False, default=False, server_default="false")
    last_known_odometer_km = Column(Numeric(10, 1), nullable=True)
    last_odometer_recorded_at = Column(TIMESTAMP(timezone=True), nullable=True)
    last_serviced_odometer_km = Column(Numeric(10, 1), nullable=True)
    last_serviced_at = Column(TIMESTAMP(timezone=True), nullable=True)
    next_service_due_date = Column(Date, nullable=True)
    next_service_due_odometer_km = Column(Numeric(10, 1), nullable=True)
    status = Column(String(30), nullable=False, default="active", server_default="active")
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
    depot = relationship("Depot", back_populates="vehicles", lazy="select")
    vehicle_type = relationship("VehicleType", back_populates="vehicles", lazy="select")
    readings = relationship(
        "Reading",
        back_populates="vehicle",
        lazy="select",
        foreign_keys="Reading.vehicle_id",
    )
    work_orders = relationship(
        "WorkOrder",
        back_populates="vehicle",
        lazy="select",
        foreign_keys="WorkOrder.vehicle_id",
    )

    def __repr__(self) -> str:
        return (
            f"<Vehicle id={self.id!r} registration_number={self.registration_number!r} "
            f"make={self.make!r} model={self.model!r} status={self.status!r}>"
        )
