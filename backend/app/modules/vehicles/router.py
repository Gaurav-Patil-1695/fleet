from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.middleware.rbac import require_role
from app.models.user import User
from app.modules.vehicles.schemas import (
    VehicleCreate,
    VehicleListResponse,
    VehicleUpdate,
)
from app.modules.vehicles.schemas import Vehicle as VehicleSchema
from app.modules.readings.schemas import ReadingListResponse
from app.modules.work_orders.schemas import WorkOrderListResponse
from app.modules.vehicles import service

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


@router.get("", response_model=VehicleListResponse, status_code=status.HTTP_200_OK)
async def list_vehicles(
    depot_id: Optional[str] = Query(None),
    vehicle_type_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    has_telematics: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(["administrator", "manager", "technician"])
    ),
) -> VehicleListResponse:
    return await service.list_vehicles(
        db=db,
        depot_id=depot_id,
        vehicle_type_id=vehicle_type_id,
        status=status,
        has_telematics=has_telematics,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=VehicleSchema, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    body: VehicleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(["administrator", "manager"])
    ),
) -> VehicleSchema:
    return await service.create_vehicle(db=db, body=body)


@router.get("/{vehicleId}", response_model=VehicleSchema, status_code=status.HTTP_200_OK)
async def get_vehicle(
    vehicleId: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(["administrator", "manager", "technician"])
    ),
) -> VehicleSchema:
    return await service.get_vehicle(db=db, vehicle_id=vehicleId)


@router.put("/{vehicleId}", response_model=VehicleSchema, status_code=status.HTTP_200_OK)
async def update_vehicle(
    vehicleId: UUID,
    body: VehicleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(["administrator", "manager"])
    ),
) -> VehicleSchema:
    return await service.update_vehicle(db=db, vehicle_id=vehicleId, body=body)


@router.delete("/{vehicleId}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(
    vehicleId: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(["administrator"])
    ),
) -> None:
    await service.delete_vehicle(db=db, vehicle_id=vehicleId)


@router.get(
    "/{vehicleId}/readings",
    response_model=ReadingListResponse,
    status_code=status.HTTP_200_OK,
)
async def list_vehicle_readings(
    vehicleId: UUID,
    source: Optional[str] = Query(None),
    is_test_mode: Optional[bool] = Query(None),
    from_: Optional[str] = Query(None, alias="from"),
    to: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(["administrator", "manager", "technician"])
    ),
) -> ReadingListResponse:
    return await service.list_vehicle_readings(
        db=db,
        vehicle_id=vehicleId,
        source=source,
        is_test_mode=is_test_mode,
        from_=from_,
        to=to,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{vehicleId}/work-orders",
    response_model=WorkOrderListResponse,
    status_code=status.HTTP_200_OK,
)
async def list_vehicle_work_orders(
    vehicleId: UUID,
    status: Optional[str] = Query(None),
    assigned_technician_id: Optional[str] = Query(None),
    from_: Optional[str] = Query(None, alias="from"),
    to: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(["administrator", "manager", "technician"])
    ),
) -> WorkOrderListResponse:
    return await service.list_vehicle_work_orders(
        db=db,
        vehicle_id=vehicleId,
        status=status,
        assigned_technician_id=assigned_technician_id,
        from_=from_,
        to=to,
        page=page,
        page_size=page_size,
    )
