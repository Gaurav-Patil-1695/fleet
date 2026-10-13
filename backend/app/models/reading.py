import uuid

from sqlalchemy import Boolean, Column, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql.sqltypes import TIMESTAMP

from app.database import Base


class Reading(Base):
    __tablename__ = "readings"

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
    recorded_by_user_id = Column(
        UUID(as_uuid=True),
        nullable=True,
    )
    odometer_km = Column(Numeric(10, 1), nullable=False)
    source = Column(String(20), nullable=False)
    is_test_mode = Column(Boolean, nullable=False, default=False, server_default="false")
    raw_payload = Column(JSONB, nullable=True)
    reading_timestamp = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    created_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Relationships
    vehicle = relationship(
        "Vehicle",
        back_populates="readings",
        lazy="select",
        foreign_keys=[vehicle_id],
    )
    recorded_by_user = relationship(
        "User",
        back_populates="readings",
        lazy="select",
        foreign_keys=[recorded_by_user_id],
    )
    work_orders = relationship(
        "WorkOrder",
        back_populates="post_service_reading",
        lazy="select",
        foreign_keys="WorkOrder.post_service_reading_id",
    )

    def __repr__(self) -> str:
        return (
            f"<Reading id={self.id!r} vehicle_id={self.vehicle_id!r} "
            f"odometer_km={self.odometer_km!r} source={self.source!r}>"
        )
