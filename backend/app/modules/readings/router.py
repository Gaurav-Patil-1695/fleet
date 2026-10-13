from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rbac import require_role
from app.modules.readings.schemas import ReadingCreate, ReadingListResponse, Reading
from app.modules.readings.service import (
    list_readings,
    create_reading,
    get_reading,
    list_vehicle_readings,
)

router = APIRouter()


@router.get(
    "/readings",
    response_model=ReadingListResponse,
    status_code=status.HTTP_200_OK,
)
async def list_readings_handler(
    vehicle_id: str | None = Query(None),
    source: str | None = Query(None),
    is_test_mode: bool | None = Query(None),
    from_: str | None = Query(None, alias="from"),
    to: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: object = Depends(require_role("administrator", "manager")),
) -> ReadingListResponse:
    return await list_readings(
        db=db,
        vehicle_id=vehicle_id,
        source=source,
        is_test_mode=is_test_mode,
        from_=from_,
        to=to,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/readings",
    response_model=Reading,
    status_code=status.HTTP_201_CREATED,
)
async def create_reading_handler(
    body: ReadingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: object = Depends(
        require_role("administrator", "manager", "technician")
    ),
) -> Reading:
    return await create_reading(db=db, body=body, current_user=current_user)


@router.get(
    "/readings/{reading_id}",
    response_model=Reading,
    status_code=status.HTTP_200_OK,
)
async def get_reading_handler(
    reading_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: object = Depends(
        require_role("administrator", "manager", "technician")
    ),
) -> Reading:
    return await get_reading(db=db, reading_id=reading_id)


@router.get(
    "/vehicles/{vehicle_id}/readings",
    response_model=ReadingListResponse,
    status_code=status.HTTP_200_OK,
)
async def list_vehicle_readings_handler(
    vehicle_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: object = Depends(
        require_role("administrator", "manager", "technician")
    ),
) -> ReadingListResponse:
    return await list_vehicle_readings(
        db=db,
        vehicle_id=vehicle_id,
        page=page,
        page_size=page_size,
    )
