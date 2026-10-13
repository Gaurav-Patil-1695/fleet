import uuid

from sqlalchemy import Boolean, Column, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql.sqltypes import TIMESTAMP

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    depot_id = Column(
        UUID(as_uuid=True),
        nullable=True,
    )
    full_name = Column(String(200), nullable=False)
    email = Column(String(320), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False)
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
    depot = relationship("Depot", back_populates="users", lazy="select")
    readings = relationship(
        "Reading",
        back_populates="recorded_by_user",
        lazy="select",
        foreign_keys="Reading.recorded_by_user_id",
    )
    work_orders_raised = relationship(
        "WorkOrder",
        back_populates="raised_by_user",
        lazy="select",
        foreign_keys="WorkOrder.raised_by_user_id",
    )
    work_orders_assigned = relationship(
        "WorkOrder",
        back_populates="assigned_technician",
        lazy="select",
        foreign_keys="WorkOrder.assigned_technician_id",
    )
    work_orders_closed = relationship(
        "WorkOrder",
        back_populates="closed_by_user",
        lazy="select",
        foreign_keys="WorkOrder.closed_by_user_id",
    )

    def __repr__(self) -> str:
        return f"<User id={self.id!r} email={self.email!r} role={self.role!r}>"
