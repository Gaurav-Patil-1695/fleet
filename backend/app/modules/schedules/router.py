from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rbac import require_role
from app.modules.schedules import schemas, service

router = APIRouter(prefix="/schedules", tags=["schedules"])


@router.get(
    "",
    response_model=schemas.ScheduleListResponse,
    status_code=status.HTTP_200_OK,
)
async def list_schedules(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    vehicle_type_id: str | None = Query(None),
    vehicle_class: str | None = Query(None),
    is_active: bool | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_role("administrator", "manager")),
) -> schemas.ScheduleListResponse:
    return await service.list_schedules(
        db=db,
        page=page,
        limit=limit,
        vehicle_type_id=vehicle_type_id,
        vehicle_class=vehicle_class,
        is_active=is_active,
    )


@router.post(
    "",
    response_model=schemas.Schedule,
    status_code=status.HTTP_201_CREATED,
)
async def create_schedule(
    body: schemas.ScheduleCreate,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_role("administrator")),
) -> schemas.Schedule:
    return await service.create_schedule(db=db, body=body)


@router.get(
    "/{scheduleId}",
    response_model=schemas.Schedule,
    status_code=status.HTTP_200_OK,
)
async def get_schedule(
    scheduleId: UUID,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_role("administrator", "manager")),
) -> schemas.Schedule:
    return await service.get_schedule(db=db, schedule_id=scheduleId)


@router.put(
    "/{scheduleId}",
    response_model=schemas.Schedule,
    status_code=status.HTTP_200_OK,
)
async def update_schedule(
    scheduleId: UUID,
    body: schemas.ScheduleUpdate,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_role("administrator")),
) -> schemas.Schedule:
    return await service.update_schedule(db=db, schedule_id=scheduleId, body=body)


@router.delete(
    "/{scheduleId}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_schedule(
    scheduleId: UUID,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_role("administrator")),
) -> Response:
    await service.delete_schedule(db=db, schedule_id=scheduleId)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
