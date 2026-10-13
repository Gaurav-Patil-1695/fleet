from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.vehicles.schemas import (
    Vehicle as VehicleSchema,
    VehicleCreate,
    VehicleListResponse,
    VehicleUpdate,
)
from app.modules.readings.schemas import ReadingListResponse
from app.modules.work_orders.schemas import WorkOrderListResponse
from app.repositories import (
    vehicle_repository,
    depot_repository,
    vehicle_type_repository,
    reading_repository,
    work_order_repository,
)
from app.services.scheduling_service import recalculate_service_due


async def list_vehicles(
    db: AsyncSession,
    depot_id: Optional[str],
    vehicle_type_id: Optional[str],
    status: Optional[str],
    has_telematics: Optional[bool],
    page: int,
    page_size: int,
) -> VehicleListResponse:
    depot_uuid = UUID(depot_id) if depot_id else None
    vehicle_type_uuid = UUID(vehicle_type_id) if vehicle_type_id else None

    vehicles, total_items = await vehicle_repository.list_vehicles(
        db=db,
        depot_id=depot_uuid,
        vehicle_type_id=vehicle_type_uuid,
        status=status,
        has_telematics=has_telematics,
        page=page,
        page_size=page_size,
    )

    total_pages = max(1, (total_items + page_size - 1) // page_size)

    return VehicleListResponse(
        data=[VehicleSchema.model_validate(v) for v in vehicles],
        pagination={
            "page": page,
            "page_size": page_size,
            "total_items": total_items,
            "total_pages": total_pages,
        },
    )


async def create_vehicle(
    db: AsyncSession,
    body: VehicleCreate,
) -> VehicleSchema:
    # Validate depot exists
    depot = await depot_repository.get_depot_by_id(db=db, depot_id=body.depot_id)
    if depot is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "DEPOT_NOT_FOUND", "message": "Depot ID must be a valid UUID."},
        )

    # Validate vehicle type exists
    vehicle_type = await vehicle_type_repository.get_vehicle_type_by_id(
        db=db, vehicle_type_id=body.vehicle_type_id
    )
    if vehicle_type is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VEHICLE_TYPE_NOT_FOUND", "message": "Vehicle type ID must be a valid UUID."},
        )

    # Check for duplicate registration number
    existing = await vehicle_repository.get_vehicle_by_registration(
        db=db, registration_number=body.registration_number
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "DUPLICATE_REGISTRATION",
                "message": "A vehicle with this registration number already exists.",
            },
        )

    vehicle = await vehicle_repository.create_vehicle(db=db, body=body)

    # Recalculate service due fields based on schedule
    vehicle = await recalculate_service_due(db=db, vehicle=vehicle)
    await db.commit()
    await db.refresh(vehicle)

    return VehicleSchema.model_validate(vehicle)


async def get_vehicle(
    db: AsyncSession,
    vehicle_id: UUID,
) -> VehicleSchema:
    vehicle = await vehicle_repository.get_vehicle_by_id(db=db, vehicle_id=vehicle_id)
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "VEHICLE_NOT_FOUND", "message": "Vehicle not found."},
        )
    return VehicleSchema.model_validate(vehicle)


async def update_vehicle(
    db: AsyncSession,
    vehicle_id: UUID,
    body: VehicleUpdate,
) -> VehicleSchema:
    vehicle = await vehicle_repository.get_vehicle_by_id(db=db, vehicle_id=vehicle_id)
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "VEHICLE_NOT_FOUND", "message": "Vehicle not found."},
        )

    # Validate depot if provided
    if body.depot_id is not None:
        depot = await depot_repository.get_depot_by_id(db=db, depot_id=body.depot_id)
        if depot is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "DEPOT_NOT_FOUND", "message": "Depot ID must be a valid UUID."},
            )

    # Validate vehicle type if provided
    if body.vehicle_type_id is not None:
        vehicle_type = await vehicle_type_repository.get_vehicle_type_by_id(
            db=db, vehicle_type_id=body.vehicle_type_id
        )
        if vehicle_type is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "VEHICLE_TYPE_NOT_FOUND", "message": "Vehicle type ID must be a valid UUID."},
            )

    # Check for duplicate registration if changing
    if (
        body.registration_number is not None
        and body.registration_number != vehicle.registration_number
    ):
        existing = await vehicle_repository.get_vehicle_by_registration(
            db=db, registration_number=body.registration_number
        )
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "DUPLICATE_REGISTRATION",
                    "message": "A vehicle with this registration number already exists.",
                },
            )

    vehicle = await vehicle_repository.update_vehicle(db=db, vehicle=vehicle, body=body)

    # Recalculate service due fields
    vehicle = await recalculate_service_due(db=db, vehicle=vehicle)
    await db.commit()
    await db.refresh(vehicle)

    return VehicleSchema.model_validate(vehicle)


async def delete_vehicle(
    db: AsyncSession,
    vehicle_id: UUID,
) -> None:
    vehicle = await vehicle_repository.get_vehicle_by_id(db=db, vehicle_id=vehicle_id)
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "VEHICLE_NOT_FOUND", "message": "Vehicle not found."},
        )

    try:
        await vehicle_repository.delete_vehicle(db=db, vehicle=vehicle)
        await db.commit()
    except Exception as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "VEHICLE_HAS_DEPENDENCIES",
                "message": "Vehicle cannot be deleted because it has related records.",
            },
        ) from exc


async def list_vehicle_readings(
    db: AsyncSession,
    vehicle_id: UUID,
    source: Optional[str],
    is_test_mode: Optional[bool],
    from_: Optional[str],
    to: Optional[str],
    page: int,
    page_size: int,
) -> ReadingListResponse:
    vehicle = await vehicle_repository.get_vehicle_by_id(db=db, vehicle_id=vehicle_id)
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "VEHICLE_NOT_FOUND", "message": "Vehicle not found."},
        )

    readings, total_items = await reading_repository.list_readings(
        db=db,
        vehicle_id=vehicle_id,
        source=source,
        is_test_mode=is_test_mode,
        from_=from_,
        to=to,
        page=page,
        page_size=page_size,
    )

    total_pages = max(1, (total_items + page_size - 1) // page_size)

    from app.modules.readings.schemas import Reading as ReadingSchema, Pagination

    return ReadingListResponse(
        data=[ReadingSchema.model_validate(r) for r in readings],
        pagination=Pagination(
            page=page,
            page_size=page_size,
            total_items=total_items,
            total_pages=total_pages,
        ),
    )


async def list_vehicle_work_orders(
    db: AsyncSession,
    vehicle_id: UUID,
    status: Optional[str],
    assigned_technician_id: Optional[str],
    from_: Optional[str],
    to: Optional[str],
    page: int,
    page_size: int,
) -> WorkOrderListResponse:
    vehicle = await vehicle_repository.get_vehicle_by_id(db=db, vehicle_id=vehicle_id)
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "VEHICLE_NOT_FOUND", "message": "Vehicle not found."},
        )

    assigned_tech_uuid = UUID(assigned_technician_id) if assigned_technician_id else None

    work_orders, total_items = await work_order_repository.list_work_orders(
        db=db,
        vehicle_id=vehicle_id,
        status=status,
        assigned_technician_id=assigned_tech_uuid,
        from_=from_,
        to=to,
        page=page,
        page_size=page_size,
    )

    total_pages = max(1, (total_items + page_size - 1) // page_size)

    from app.modules.work_orders.schemas import WorkOrder as WorkOrderSchema, Pagination

    return WorkOrderListResponse(
        data=[WorkOrderSchema.model_validate(wo) for wo in work_orders],
        pagination=Pagination(
            page=page,
            page_size=page_size,
            total_items=total_items,
            total_pages=total_pages,
        ),
    )
