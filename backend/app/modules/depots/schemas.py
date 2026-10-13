from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class DepotCreate(BaseModel):
    name: str = Field(
        ...,
        max_length=150,
        description=(
            "Depot name is required and must not exceed 150 characters."
        ),
    )
    address: str = Field(..., description="Depot address is required.")


class DepotUpdate(BaseModel):
    name: str | None = Field(
        None,
        max_length=150,
        description="Depot name must not exceed 150 characters.",
    )
    address: str | None = Field(None, description="Enter a valid depot address.")


class Depot(BaseModel):
    id: UUID
    name: str
    address: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class Pagination(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int


class DepotListResponse(BaseModel):
    data: list[Depot]
    pagination: Pagination


class VehicleServiceSummary(BaseModel):
    vehicle_id: UUID
    registration_number: str
    make: str
    model: str
    last_known_odometer_km: float | None = None
    next_service_due_date: date | None = None
    next_service_due_odometer_km: float | None = None

    model_config = {"from_attributes": True}


class DepotDashboard(BaseModel):
    depot_id: UUID
    due_for_service: list[VehicleServiceSummary]
    overdue: list[VehicleServiceSummary]
