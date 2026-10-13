from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User
from app.modules.telematics.providers.factory import get_provider
from app.modules.telematics.schemas import (
    TelematicsIngestRequest,
    TelematicsIngestResponse,
    TelematicsReadingItem,
    IngestError,
)
from app.repositories.vehicle_repository import get_vehicle_by_id
from app.repositories.reading_repository import create_reading
from app.services.scheduling_service import recalculate_vehicle_service_due


async def ingest_telematics_readings(
    *,
    body: TelematicsIngestRequest,
    db: AsyncSession,
    current_user: User,
) -> TelematicsIngestResponse:
    """Ingest a batch of telematics odometer readings.

    Resolves the active OdometerProvider from config, then for each reading:
    - validates the vehicle exists
    - persists the reading via the reading repository
    - triggers service-due recalculation
    """
    provider = get_provider()
    is_test_mode: bool = provider.is_test_mode()

    source: str
    if is_test_mode:
        source = "telematics_mock"
    else:
        source = "telematics"

    accepted: int = 0
    rejected: int = 0
    errors: list[dict[str, Any]] = []

    for item in body.readings:
        vehicle_id_str = str(item.vehicle_id)

        # Validate vehicle exists
        vehicle = await get_vehicle_by_id(db=db, vehicle_id=item.vehicle_id)
        if vehicle is None:
            rejected += 1
            errors.append(
                {"vehicle_id": vehicle_id_str, "reason": "Vehicle not found."}
            )
            continue

        # Persist the reading
        try:
            reading = await create_reading(
                db=db,
                vehicle_id=item.vehicle_id,
                recorded_by_user_id=None,
                odometer_km=item.odometer_km,
                source=source,
                is_test_mode=is_test_mode,
                raw_payload=item.raw_payload,
                reading_timestamp=item.reading_timestamp,
            )
        except Exception as exc:  # noqa: BLE001
            rejected += 1
            errors.append(
                {"vehicle_id": vehicle_id_str, "reason": f"Failed to persist reading: {exc}"}
            )
            continue

        # Trigger recalculation of next service due
        try:
            await recalculate_vehicle_service_due(
                db=db,
                vehicle=vehicle,
                latest_odometer_km=float(item.odometer_km),
                reading_timestamp=item.reading_timestamp,
            )
        except Exception as exc:  # noqa: BLE001
            # Recalculation failure is non-fatal; reading is already accepted
            # Log server-side only; do not surface internal details
            import logging
            logging.getLogger(__name__).warning(
                "Service-due recalculation failed for vehicle %s: %s",
                vehicle_id_str,
                exc,
            )

        accepted += 1

    return TelematicsIngestResponse(
        accepted=accepted,
        rejected=rejected,
        errors=errors,
    )
