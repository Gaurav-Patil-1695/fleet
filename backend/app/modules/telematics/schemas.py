from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator


class TelematicsReadingPayload(BaseModel):
    """A single telematics odometer reading item within an ingest request."""

    vehicle_id: uuid.UUID = Field(
        ...,
        description="Vehicle ID must be a valid UUID.",
    )
    odometer_km: float = Field(
        ...,
        ge=0,
        description="Odometer reading must be a non-negative number.",
    )
    reading_timestamp: datetime = Field(
        ...,
        description="Reading timestamp must be a valid date-time value.",
    )
    raw_payload: dict[str, Any] | None = Field(
        default=None,
        description="Optional raw telematics payload.",
    )


# Alias used by service.py — TelematicsReadingItem resolves to TelematicsReadingPayload
TelematicsReadingItem = TelematicsReadingPayload


class TelematicsIngestRequest(BaseModel):
    """Top-level request wrapper containing a list of telematics reading items."""

    readings: list[TelematicsReadingPayload] = Field(
        ...,
        min_length=1,
        description="At least one telematics reading is required.",
    )

    @field_validator("readings")
    @classmethod
    def readings_must_not_be_empty(
        cls, v: list[TelematicsReadingPayload]
    ) -> list[TelematicsReadingPayload]:
        if not v:
            raise ValueError("At least one telematics reading is required.")
        return v


class IngestError(BaseModel):
    """Details about a single rejected reading."""

    vehicle_id: uuid.UUID | None = None
    reason: str


class TelematicsIngestResponse(BaseModel):
    """Response returned after processing a telematics ingest batch."""

    accepted: int = Field(..., description="Number of readings successfully ingested")
    rejected: int = Field(..., description="Number of readings that failed validation")
    errors: list[dict[str, Any]] = Field(
        default_factory=list,
        description="Details about each rejected reading",
    )
