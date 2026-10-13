from uuid import UUID
import math

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.modules.readings.schemas import (
    Reading,
    ReadingCreate,
    ReadingListResponse,
)
from app.repositories.reading_repository import (
    get_reading_by_id,
    create_reading as repo_create_reading,
    list_readings as repo_list_readings,
    count_readings,
)
from app.repositories.vehicle_repository import (
    get_vehicle_by_id,
    update_vehicle_odometer,
)
from app.services.scheduling_service import recalculate_next_service
from app.modules.readings.schemas import Pagination


async def get_reading(
    db: AsyncSession,
    reading_id: UUID,
) -> Reading:
    reading = await get_reading_by_id(db=db, reading_id=reading_id)
    if reading is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "READING_NOT_FOUND", "message": "Reading not found."},
        )
    return Reading.model_validate(reading)


async def list_readings(
    db: AsyncSession,
    vehicle_id: str | None = None,
    source: str | None = None,
    is_test_mode: bool | None = None,
    from_: str | None = None,
    to: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> ReadingListResponse:
    from datetime import datetime, timezone

    from_dt: datetime | None = None
    to_dt: datetime | None = None

    if from_ is not None:
        try:
            from_dt = datetime.fromisoformat(from_.replace("Z", "+00:00"))
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_DATE",
                    "message": "'from' must be a valid ISO 8601 date-time value.",
                },
            ) from exc

    if to is not None:
        try:
            to_dt = datetime.fromisoformat(to.replace("Z", "+00:00"))
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_DATE",
                    "message": "'to' must be a valid ISO 8601 date-time value.",
                },
            ) from exc

    vehicle_uuid: UUID | None = None
    if vehicle_id is not None:
        try:
            vehicle_uuid = UUID(vehicle_id)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_UUID",
                    "message": "Vehicle ID must be a valid UUID.",
                },
            ) from exc

    offset = (page - 1) * page_size

    readings = await repo_list_readings(
        db=db,
        vehicle_id=vehicle_uuid,
        source=source,
        is_test_mode=is_test_mode,
        from_dt=from_dt,
        to_dt=to_dt,
        offset=offset,
        limit=page_size,
    )

    total_items = await count_readings(
        db=db,
        vehicle_id=vehicle_uuid,
        source=source,
        is_test_mode=is_test_mode,
        from_dt=from_dt,
        to_dt=to_dt,
    )

    total_pages = max(1, math.ceil(total_items / page_size))

    return ReadingListResponse(
        data=[Reading.model_validate(r) for r in readings],
        pagination=Pagination(
            page=page,
            page_size=page_size,
            total_items=total_items,
            total_pages=total_pages,
        ),
    )


async def list_vehicle_readings(
    db: AsyncSession,
    vehicle_id: UUID,
    page: int = 1,
    page_size: int = 20,
) -> ReadingListResponse:
    vehicle = await get_vehicle_by_id(db=db, vehicle_id=vehicle_id)
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "VEHICLE_NOT_FOUND", "message": "Vehicle not found."},
        )

    offset = (page - 1) * page_size

    readings = await repo_list_readings(
        db=db,
        vehicle_id=vehicle_id,
        source=None,
        is_test_mode=None,
        from_dt=None,
        to_dt=None,
        offset=offset,
        limit=page_size,
    )

    total_items = await count_readings(
        db=db,
        vehicle_id=vehicle_id,
        source=None,
        is_test_mode=None,
        from_dt=None,
        to_dt=None,
    )

    total_pages = max(1, math.ceil(total_items / page_size))

    return ReadingListResponse(
        data=[Reading.model_validate(r) for r in readings],
        pagination=Pagination(
            page=page,
            page_size=page_size,
            total_items=total_items,
            total_pages=total_pages,
        ),
    )


async def create_reading(
    db: AsyncSession,
    body: ReadingCreate,
    current_user: User,
) -> Reading:
    # Validate vehicle exists
    vehicle = await get_vehicle_by_id(db=db, vehicle_id=body.vehicle_id)
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "VEHICLE_NOT_FOUND", "message": "Vehicle not found."},
        )

    # For manual readings, set the recorded_by_user_id to current user
    recorded_by_user_id: UUID | None = None
    if body.source == "manual":
        recorded_by_user_id = current_user.id
    elif body.source == "telematics":
        # telematics readings may not have a user
        recorded_by_user_id = None

    is_test_mode = body.is_test_mode if body.is_test_mode is not None else False

    # Determine actual source stored - if is_test_mode and telematics,
    # use telematics_mock
    stored_source = body.source
    if body.source == "telematics" and is_test_mode:
        stored_source = "telematics_mock"

    reading = await repo_create_reading(
        db=db,
        vehicle_id=body.vehicle_id,
        recorded_by_user_id=recorded_by_user_id,
        odometer_km=body.odometer_km,
        source=stored_source,
        is_test_mode=is_test_mode,
        raw_payload=body.raw_payload,
        reading_timestamp=body.reading_timestamp,
    )

    # Update vehicle's latest odometer if this reading is newer
    await update_vehicle_odometer(
        db=db,
        vehicle_id=body.vehicle_id,
        odometer_km=body.odometer_km,
        recorded_at=body.reading_timestamp,
        reading_id=reading.id,
    )

    # Recalculate next service due date and odometer
    await recalculate_next_service(
        db=db,
        vehicle_id=body.vehicle_id,
    )

    await db.refresh(reading)

    return Reading.model_validate(reading)
