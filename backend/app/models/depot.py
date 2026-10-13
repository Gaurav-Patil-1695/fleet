import uuid

from sqlalchemy import Column, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql.sqltypes import TIMESTAMP

from app.database import Base


class Depot(Base):
    __tablename__ = "depots"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    name = Column(String(150), nullable=False, unique=True)
    address = Column(Text, nullable=True)
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
    users = relationship("User", back_populates="depot", lazy="select")
    vehicles = relationship("Vehicle", back_populates="depot", lazy="select")
    work_orders = relationship("WorkOrder", back_populates="depot", lazy="select")

    def __repr__(self) -> str:
        return f"<Depot id={self.id!r} name={self.name!r}>"
