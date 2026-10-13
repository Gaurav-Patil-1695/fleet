from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class ReadingCreate(BaseModel):
    vehicle_id: UUID = Field(..., description="Vehicle ID must be a valid UUID.")
    odometer_km: float = Field(
        ...,
        ge=0,
        description="Odometer reading is required and must be a non-negative number.",
    )
    source: str = Field(
        ...,
        description="Source must be either 'manual' or 'telematics'.",
    )
    is_test_mode: bool | None = Field(
        None,
        description="Test mode must be true or false.",
    )
    raw_payload: dict[str, Any] | None = None
    reading_timestamp: datetime = Field(
        ...,
        description=(
            "Reading timestamp is required and must be a valid date-time value."
        ),
    )

    @field_validator("vehicle_id", mode="before")
    @classmethod
    def validate_vehicle_id(cls, v: Any) -> Any:
        if v is None:
            raise ValueError("Vehicle ID must be a valid UUID.")
        return v

    @field_validator("odometer_km", mode="before")
    @classmethod
    def validate_odometer_km(cls, v: Any) -> Any:
        if v is None:
            raise ValueError(
                "Odometer reading is required and must be a non-negative number."
            )
        try:
            v_float = float(v)
        except (TypeError, ValueError) as exc:
            raise ValueError(
                "Odometer reading is required and must be a non-negative number."
            ) from exc
        if v_float < 0:
            raise ValueError(
                "Odometer reading is required and must be a non-negative number."
            )
        return v_float

    @field_validator("source", mode="before")
    @classmethod
    def validate_source(cls, v: Any) -> Any:
        if v is None:
            raise ValueError("Source must be either 'manual' or 'telematics'.")
        if str(v) not in ("manual", "telematics"):
            raise ValueError("Source must be either 'manual' or 'telematics'.")
        if len(str(v)) > 20:
            raise ValueError("Source must be either 'manual' or 'telematics'.")
        return v

    @field_validator("is_test_mode", mode="before")
    @classmethod
    def validate_is_test_mode(cls, v: Any) -> Any:
        if v is None:
            return v
        if not isinstance(v, bool):
            raise ValueError("Test mode must be true or false.")
        return v

    @field_validator("reading_timestamp", mode="before")
    @classmethod
    def validate_reading_timestamp(cls, v: Any) -> Any:
        if v is None:
            raise ValueError(
                "Reading timestamp is required and must be a valid date-time value."
            )
        return v


class Reading(BaseModel):
    id: UUID
    vehicle_id: UUID
    recorded_by_user_id: UUID | None = None
    odometer_km: float
    source: str
    is_test_mode: bool
    raw_payload: dict[str, Any] | None = None
    reading_timestamp: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class Pagination(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int


class ReadingListResponse(BaseModel):
    data: list[Reading]
    pagination: Pagination
