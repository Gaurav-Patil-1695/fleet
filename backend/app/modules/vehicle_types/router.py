from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rbac import require_role
from app.modules.vehicle_types.schemas import (
    VehicleTypeCreate,
    VehicleTypeListResponse,
    VehicleTypeUpdate,
)
from app.modules.vehicle_types.service import VehicleTypeService
from app.modules.auth.schemas import TokenResponse
from app.models.vehicle_type import VehicleType
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/vehicle-types", tags=["vehicle-types"])


@router.get(
    "",
    response_model=VehicleTypeListResponse,
    status_code=status.HTTP_200_OK,
)
async def list_vehicle_types(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    vehicle_class: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(["administrator", "manager", "technician"])
    ),
) -> VehicleTypeListResponse:
    service = VehicleTypeService(db)
    return await service.list_vehicle_types(
        page=page,
        page_size=pageSize,
        search=search,
        vehicle_class=vehicle_class,
    )


@router.post(
    "",
    response_model=VehicleType,
    status_code=status.HTTP_201_CREATED,
)
async def create_vehicle_type(
    body: VehicleTypeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["administrator"])),
) -> VehicleType:
    service = VehicleTypeService(db)
    return await service.create_vehicle_type(body)


@router.get(
    "/{vehicleTypeId}",
    response_model=VehicleType,
    status_code=status.HTTP_200_OK,
)
async def get_vehicle_type(
    vehicleTypeId: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(["administrator", "manager", "technician"])
    ),
) -> VehicleType:
    service = VehicleTypeService(db)
    return await service.get_vehicle_type(vehicleTypeId)


@router.put(
    "/{vehicleTypeId}",
    response_model=VehicleType,
    status_code=status.HTTP_200_OK,
)
async def update_vehicle_type(
    vehicleTypeId: UUID,
    body: VehicleTypeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["administrator"])),
) -> VehicleType:
    service = VehicleTypeService(db)
    return await service.update_vehicle_type(vehicleTypeId, body)


@router.delete(
    "/{vehicleTypeId}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_vehicle_type(
    vehicleTypeId: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["administrator"])),
) -> None:
    service = VehicleTypeService(db)
    await service.delete_vehicle_type(vehicleTypeId)
