from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class WorkOrderCreate(BaseModel):
    vehicle_id: UUID = Field(..., description="Vehicle ID must be a valid UUID.")
    depot_id: UUID = Field(..., description="Depot ID must be a valid UUID.")
    description: Optional[str] = Field(default=None, description="Enter a valid work order description.")

    @field_validator("vehicle_id", mode="before")
    @classmethod
    def validate_vehicle_id(cls, v: object) -> object:
        if v is None or (isinstance(v, str) and not v.strip()):
            raise ValueError("Vehicle ID must be a valid UUID.")
        return v

    @field_validator("depot_id", mode="before")
    @classmethod
    def validate_depot_id(cls, v: object) -> object:
        if v is None or (isinstance(v, str) and not v.strip()):
            raise ValueError("Depot ID must be a valid UUID.")
        return v


class WorkOrderUpdate(BaseModel):
    description: Optional[str] = Field(default=None, description="Enter a valid work order description.")


class WorkOrderAssign(BaseModel):
    assigned_technician_id: UUID = Field(..., description="Technician ID must be a valid UUID.")

    @field_validator("assigned_technician_id", mode="before")
    @classmethod
    def validate_assigned_technician_id(cls, v: object) -> object:
        if v is None or (isinstance(v, str) and not v.strip()):
            raise ValueError("Technician ID must be a valid UUID.")
        return v


class WorkOrderClose(BaseModel):
    completion_notes: str = Field(..., description="Completion notes are required to close a work order.")
    post_service_odometer_km: float = Field(
        ...,
        ge=0,
        description="Post-service odometer reading is required and must be a non-negative number.",
    )

    @field_validator("completion_notes", mode="before")
    @classmethod
    def validate_completion_notes(cls, v: object) -> object:
        if v is None or (isinstance(v, str) and not v.strip()):
            raise ValueError("Completion notes are required to close a work order.")
        return v

    @field_validator("post_service_odometer_km", mode="before")
    @classmethod
    def validate_post_service_odometer_km(cls, v: object) -> object:
        if v is None:
            raise ValueError(
                "Post-service odometer reading is required and must be a non-negative number."
            )
        try:
            val = float(v)  # type: ignore[arg-type]
        except (TypeError, ValueError):
            raise ValueError(
                "Post-service odometer reading is required and must be a non-negative number."
            )
        if val < 0:
            raise ValueError(
                "Post-service odometer reading is required and must be a non-negative number."
            )
        return val


class WorkOrder(BaseModel):
    id: UUID
    vehicle_id: UUID
    depot_id: UUID
    assigned_technician_id: Optional[UUID] = None
    raised_by_user_id: UUID
    closed_by_user_id: Optional[UUID] = None
    status: str
    description: Optional[str] = None
    completion_notes: Optional[str] = None
    post_service_odometer_km: Optional[float] = None
    post_service_reading_id: Optional[UUID] = None
    raised_at: datetime
    closed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class Pagination(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int


class WorkOrderListResponse(BaseModel):
    data: List[WorkOrder]
    pagination: Pagination
