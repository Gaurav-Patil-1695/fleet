from uuid import UUID
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.modules.work_orders.schemas import (
    WorkOrderCreate,
    WorkOrderUpdate,
    WorkOrderAssign,
    WorkOrderClose,
    WorkOrderListResponse,
)
from app.modules.work_orders.schemas import WorkOrder as WorkOrderSchema
from app.repositories.work_order_repository import work_order_repository
from app.repositories.vehicle_repository import vehicle_repository
from app.repositories.user_repository import user_repository
from app.repositories.reading_repository import reading_repository
from app.services.scheduling_service import scheduling_service


async def list_work_orders(
    db: AsyncSession,
    current_user: User,
    page: str = "1",
    page_size: str = "20",
    status: Optional[str] = None,
    depot_id: Optional[str] = None,
) -> WorkOrderListResponse:
    page_int = max(1, int(page))
    page_size_int = max(1, min(100, int(page_size)))

    depot_uuid: Optional[UUID] = None
    if depot_id:
        try:
            depot_uuid = UUID(depot_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVALID_DEPOT_ID", "message": "Depot ID must be a valid UUID."},
            )

    work_orders, total = await work_order_repository.list_work_orders(
        db=db,
        page=page_int,
        page_size=page_size_int,
        status=status,
        depot_id=depot_uuid,
    )

    import math
    total_pages = max(1, math.ceil(total / page_size_int))

    return WorkOrderListResponse(
        data=[WorkOrderSchema.model_validate(wo) for wo in work_orders],
        pagination={
            "page": page_int,
            "page_size": page_size_int,
            "total_items": total,
            "total_pages": total_pages,
        },
    )


async def list_my_work_orders(
    db: AsyncSession,
    current_user: User,
    page: str = "1",
    page_size: str = "20",
    status: Optional[str] = None,
) -> WorkOrderListResponse:
    page_int = max(1, int(page))
    page_size_int = max(1, min(100, int(page_size)))

    work_orders, total = await work_order_repository.list_work_orders(
        db=db,
        page=page_int,
        page_size=page_size_int,
        status=status,
        assigned_technician_id=current_user.id,
    )

    import math
    total_pages = max(1, math.ceil(total / page_size_int))

    return WorkOrderListResponse(
        data=[WorkOrderSchema.model_validate(wo) for wo in work_orders],
        pagination={
            "page": page_int,
            "page_size": page_size_int,
            "total_items": total,
            "total_pages": total_pages,
        },
    )


async def create_work_order(
    db: AsyncSession,
    body: WorkOrderCreate,
    current_user: User,
) -> WorkOrderSchema:
    # Validate vehicle exists
    vehicle = await vehicle_repository.get_by_id(db=db, vehicle_id=body.vehicle_id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "VEHICLE_NOT_FOUND", "message": "Vehicle not found."},
        )

    # Validate depot exists (basic FK check; full depot validation done by DB)
    work_order = await work_order_repository.create_work_order(
        db=db,
        vehicle_id=body.vehicle_id,
        depot_id=body.depot_id,
        raised_by_user_id=current_user.id,
        description=body.description,
    )

    return WorkOrderSchema.model_validate(work_order)


async def get_work_order(
    db: AsyncSession,
    work_order_id: UUID,
    current_user: User,
) -> WorkOrderSchema:
    work_order = await work_order_repository.get_by_id(db=db, work_order_id=work_order_id)
    if not work_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "WORK_ORDER_NOT_FOUND", "message": "Work order not found."},
        )
    return WorkOrderSchema.model_validate(work_order)


async def update_work_order(
    db: AsyncSession,
    work_order_id: UUID,
    body: WorkOrderUpdate,
    current_user: User,
) -> WorkOrderSchema:
    work_order = await work_order_repository.get_by_id(db=db, work_order_id=work_order_id)
    if not work_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "WORK_ORDER_NOT_FOUND", "message": "Work order not found."},
        )

    if work_order.status in ("closed", "cancelled"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "WORK_ORDER_NOT_EDITABLE",
                "message": "Cannot update a closed or cancelled work order.",
            },
        )

    updated = await work_order_repository.update_work_order(
        db=db,
        work_order=work_order,
        updates={"description": body.description} if body.description is not None else {},
    )

    return WorkOrderSchema.model_validate(updated)


async def delete_work_order(
    db: AsyncSession,
    work_order_id: UUID,
    current_user: User,
) -> None:
    work_order = await work_order_repository.get_by_id(db=db, work_order_id=work_order_id)
    if not work_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "WORK_ORDER_NOT_FOUND", "message": "Work order not found."},
        )

    if work_order.status != "open":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "WORK_ORDER_NOT_DELETABLE",
                "message": "Only open work orders can be deleted.",
            },
        )

    await work_order_repository.delete_work_order(db=db, work_order=work_order)


async def assign_work_order(
    db: AsyncSession,
    work_order_id: UUID,
    body: WorkOrderAssign,
    current_user: User,
) -> WorkOrderSchema:
    work_order = await work_order_repository.get_by_id(db=db, work_order_id=work_order_id)
    if not work_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "WORK_ORDER_NOT_FOUND", "message": "Work order not found."},
        )

    if work_order.status in ("closed", "cancelled"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "WORK_ORDER_NOT_ASSIGNABLE",
                "message": "Cannot assign a closed or cancelled work order.",
            },
        )

    # Validate technician exists and has the technician role
    technician = await user_repository.get_by_id(db=db, user_id=body.assigned_technician_id)
    if not technician:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "TECHNICIAN_NOT_FOUND", "message": "Technician not found."},
        )
    if technician.role != "technician":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_TECHNICIAN",
                "message": "Technician ID must be a valid UUID.",
            },
        )

    new_status = "in_progress" if work_order.status == "open" else work_order.status
    updated = await work_order_repository.update_work_order(
        db=db,
        work_order=work_order,
        updates={
            "assigned_technician_id": body.assigned_technician_id,
            "status": new_status,
        },
    )

    return WorkOrderSchema.model_validate(updated)


async def close_work_order(
    db: AsyncSession,
    work_order_id: UUID,
    body: WorkOrderClose,
    current_user: User,
) -> WorkOrderSchema:
    work_order = await work_order_repository.get_by_id(db=db, work_order_id=work_order_id)
    if not work_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "WORK_ORDER_NOT_FOUND", "message": "Work order not found."},
        )

    if work_order.status == "closed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "WORK_ORDER_ALREADY_CLOSED",
                "message": "Work order is already closed.",
            },
        )

    if work_order.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "WORK_ORDER_CANCELLED",
                "message": "Cannot close a cancelled work order.",
            },
        )

    # Validate inputs
    if not body.completion_notes or not body.completion_notes.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "VALIDATION_ERROR",
                "message": "Completion notes are required to close a work order.",
            },
        )

    if body.post_service_odometer_km < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "VALIDATION_ERROR",
                "message": "Post-service odometer reading is required and must be a non-negative number.",
            },
        )

    now = datetime.now(timezone.utc)

    # Create a post-service reading record
    reading = await reading_repository.create_reading(
        db=db,
        vehicle_id=work_order.vehicle_id,
        recorded_by_user_id=current_user.id,
        odometer_km=body.post_service_odometer_km,
        source="manual",
        is_test_mode=False,
        raw_payload=None,
        reading_timestamp=now,
    )

    # Update the work order to closed
    closed_work_order = await work_order_repository.update_work_order(
        db=db,
        work_order=work_order,
        updates={
            "status": "closed",
            "completion_notes": body.completion_notes,
            "post_service_odometer_km": body.post_service_odometer_km,
            "post_service_reading_id": reading.id,
            "closed_by_user_id": current_user.id,
            "closed_at": now,
        },
    )

    # Reset service clock via scheduling service
    vehicle = await vehicle_repository.get_by_id(db=db, vehicle_id=work_order.vehicle_id)
    if vehicle:
        await scheduling_service.reset_service_clock(
            db=db,
            vehicle=vehicle,
            serviced_odometer_km=body.post_service_odometer_km,
            serviced_at=now,
        )

    return WorkOrderSchema.model_validate(closed_work_order)
