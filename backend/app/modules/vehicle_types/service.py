from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.vehicle_types.schemas import (
    VehicleTypeCreate,
    VehicleTypeListResponse,
    VehicleTypeUpdate,
)
from app.repositories.vehicle_type_repository import VehicleTypeRepository


class VehicleTypeService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = VehicleTypeRepository(db)

    async def list_vehicle_types(
        self,
        page: int,
        page_size: int,
        search: str | None,
        vehicle_class: str | None,
    ) -> VehicleTypeListResponse:
        items, total = await self._repo.list_vehicle_types(
            page=page,
            page_size=page_size,
            search=search,
            vehicle_class=vehicle_class,
        )
        total_pages = max(1, (total + page_size - 1) // page_size)
        return VehicleTypeListResponse(
            data=items,
            pagination={
                "page": page,
                "page_size": page_size,
                "total_items": total,
                "total_pages": total_pages,
            },
        )

    async def create_vehicle_type(self, body: VehicleTypeCreate):
        existing = await self._repo.get_by_name(body.name)
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "VEHICLE_TYPE_NAME_CONFLICT",
                    "message": "A vehicle type with this name already exists.",
                },
            )
        vehicle_type = await self._repo.create_vehicle_type(body)
        return vehicle_type

    async def get_vehicle_type(self, vehicle_type_id: UUID):
        vehicle_type = await self._repo.get_by_id(vehicle_type_id)
        if vehicle_type is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "VEHICLE_TYPE_NOT_FOUND",
                    "message": "Vehicle type not found.",
                },
            )
        return vehicle_type

    async def update_vehicle_type(self, vehicle_type_id: UUID, body: VehicleTypeUpdate):
        vehicle_type = await self._repo.get_by_id(vehicle_type_id)
        if vehicle_type is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "VEHICLE_TYPE_NOT_FOUND",
                    "message": "Vehicle type not found.",
                },
            )
        if body.name is not None and body.name != vehicle_type.name:
            existing = await self._repo.get_by_name(body.name)
            if existing is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "code": "VEHICLE_TYPE_NAME_CONFLICT",
                        "message": "A vehicle type with this name already exists.",
                    },
                )
        updated = await self._repo.update_vehicle_type(vehicle_type, body)
        return updated

    async def delete_vehicle_type(self, vehicle_type_id: UUID) -> None:
        vehicle_type = await self._repo.get_by_id(vehicle_type_id)
        if vehicle_type is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "VEHICLE_TYPE_NOT_FOUND",
                    "message": "Vehicle type not found.",
                },
            )
        in_use = await self._repo.is_in_use(vehicle_type_id)
        if in_use:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "VEHICLE_TYPE_IN_USE",
                    "message": "Vehicle type is in use and cannot be deleted.",
                },
            )
        await self._repo.delete_vehicle_type(vehicle_type)
