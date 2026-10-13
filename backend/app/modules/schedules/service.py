from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schedule import Schedule as ScheduleModel
from app.models.vehicle import Vehicle as VehicleModel
from app.models.vehicle_type import VehicleType as VehicleTypeModel
from app.repositories.schedule_repository import ScheduleRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.services.scheduling_service import recalculate_vehicle_schedule
from app.modules.schedules.schemas import (
    Schedule,
    ScheduleCreate,
    ScheduleListResponse,
    ScheduleUpdate,
    Pagination,
)


async def list_schedules(
    db: AsyncSession,
    page: int,
    limit: int,
    vehicle_type_id: str | None,
    vehicle_class: str | None,
    is_active: bool | None,
) -> ScheduleListResponse:
    repo = ScheduleRepository(db)
    filters = []
    if vehicle_type_id is not None:
        try:
            vt_uuid = UUID(vehicle_type_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVALID_VEHICLE_TYPE_ID", "message": "Vehicle type ID must be a valid UUID."},
            )
        filters.append(ScheduleModel.vehicle_type_id == vt_uuid)
    if vehicle_class is not None:
        filters.append(ScheduleModel.vehicle_class == vehicle_class)
    if is_active is not None:
        filters.append(ScheduleModel.is_active == is_active)

    offset = (page - 1) * limit

    count_stmt = select(func.count()).select_from(ScheduleModel)
    if filters:
        count_stmt = count_stmt.where(and_(*filters))
    count_result = await db.execute(count_stmt)
    total_items = count_result.scalar_one()

    stmt = select(ScheduleModel).order_by(ScheduleModel.created_at.desc())
    if filters:
        stmt = stmt.where(and_(*filters))
    stmt = stmt.offset(offset).limit(limit)
    result = await db.execute(stmt)
    rows = result.scalars().all()

    total_pages = max(1, (total_items + limit - 1) // limit)

    return ScheduleListResponse(
        data=[Schedule.model_validate(row) for row in rows],
        pagination=Pagination(
            page=page,
            page_size=limit,
            total_items=total_items,
            total_pages=total_pages,
        ),
    )


async def get_schedule(db: AsyncSession, schedule_id: UUID) -> Schedule:
    stmt = select(ScheduleModel).where(ScheduleModel.id == schedule_id)
    result = await db.execute(stmt)
    row = result.scalar_one_or_none()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SCHEDULE_NOT_FOUND", "message": "Schedule not found."},
        )
    return Schedule.model_validate(row)


async def create_schedule(db: AsyncSession, body: ScheduleCreate) -> Schedule:
    # Validate vehicle_type_id exists
    vt_stmt = select(VehicleTypeModel).where(VehicleTypeModel.id == body.vehicle_type_id)
    vt_result = await db.execute(vt_stmt)
    vt_row = vt_result.scalar_one_or_none()
    if vt_row is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VEHICLE_TYPE_NOT_FOUND", "message": "Vehicle type ID must be a valid UUID."},
        )

    # Check for conflict: active schedule already exists for this vehicle_type_id
    if body.is_active is True or body.is_active is None:
        conflict_stmt = select(ScheduleModel).where(
            and_(
                ScheduleModel.vehicle_type_id == body.vehicle_type_id,
                ScheduleModel.is_active == True,  # noqa: E712
            )
        )
        conflict_result = await db.execute(conflict_stmt)
        existing = conflict_result.scalar_one_or_none()
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "ACTIVE_SCHEDULE_EXISTS",
                    "message": "An active schedule already exists for this vehicle type.",
                },
            )

    is_active = body.is_active if body.is_active is not None else True

    new_schedule = ScheduleModel(
        vehicle_type_id=body.vehicle_type_id,
        vehicle_class=body.vehicle_class,
        km_interval=body.km_interval,
        month_interval=body.month_interval,
        is_active=is_active,
    )
    db.add(new_schedule)
    await db.flush()
    await db.refresh(new_schedule)

    # Trigger recalculation for all vehicles of this vehicle type
    if is_active:
        await _recalculate_vehicles_for_type(db, body.vehicle_type_id, new_schedule)

    await db.commit()
    await db.refresh(new_schedule)
    return Schedule.model_validate(new_schedule)


async def update_schedule(
    db: AsyncSession, schedule_id: UUID, body: ScheduleUpdate
) -> Schedule:
    stmt = select(ScheduleModel).where(ScheduleModel.id == schedule_id)
    result = await db.execute(stmt)
    row = result.scalar_one_or_none()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SCHEDULE_NOT_FOUND", "message": "Schedule not found."},
        )

    # If activating this schedule, check for conflicts
    if body.is_active is True and not row.is_active:
        conflict_stmt = select(ScheduleModel).where(
            and_(
                ScheduleModel.vehicle_type_id == row.vehicle_type_id,
                ScheduleModel.is_active == True,  # noqa: E712
                ScheduleModel.id != schedule_id,
            )
        )
        conflict_result = await db.execute(conflict_stmt)
        existing = conflict_result.scalar_one_or_none()
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "ACTIVE_SCHEDULE_EXISTS",
                    "message": "An active schedule already exists for this vehicle type.",
                },
            )

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(row, field, value)

    from app.utils.datetime_utils import utcnow
    row.updated_at = utcnow()

    await db.flush()
    await db.refresh(row)

    # Trigger recalculation for all vehicles of this vehicle type if schedule is active
    if row.is_active:
        await _recalculate_vehicles_for_type(db, row.vehicle_type_id, row)

    await db.commit()
    await db.refresh(row)
    return Schedule.model_validate(row)


async def delete_schedule(db: AsyncSession, schedule_id: UUID) -> None:
    stmt = select(ScheduleModel).where(ScheduleModel.id == schedule_id)
    result = await db.execute(stmt)
    row = result.scalar_one_or_none()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SCHEDULE_NOT_FOUND", "message": "Schedule not found."},
        )

    # Check if any vehicles reference this schedule indirectly via active usage
    # Per DB constraint: ON DELETE RESTRICT on vehicle_type_id in schedules -> vehicle_types
    # If this schedule is active and vehicles are tied to this vehicle type, raise 409
    if row.is_active:
        vehicle_stmt = select(func.count()).select_from(VehicleModel).where(
            VehicleModel.vehicle_type_id == row.vehicle_type_id
        )
        vehicle_result = await db.execute(vehicle_stmt)
        vehicle_count = vehicle_result.scalar_one()
        if vehicle_count > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "SCHEDULE_IN_USE",
                    "message": "Cannot delete an active schedule that is in use by vehicles.",
                },
            )

    await db.delete(row)
    await db.commit()


async def _recalculate_vehicles_for_type(
    db: AsyncSession,
    vehicle_type_id: UUID,
    schedule: ScheduleModel,
) -> None:
    """Recalculate next service due date and odometer for all vehicles of the given type."""
    vehicles_stmt = select(VehicleModel).where(
        and_(
            VehicleModel.vehicle_type_id == vehicle_type_id,
            VehicleModel.status != "decommissioned",
        )
    )
    vehicles_result = await db.execute(vehicles_stmt)
    vehicles = vehicles_result.scalars().all()

    for vehicle in vehicles:
        await recalculate_vehicle_schedule(db=db, vehicle=vehicle, schedule=schedule)
