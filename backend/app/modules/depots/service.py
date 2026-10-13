from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.depots.schemas import (
    Depot,
    DepotCreate,
    DepotDashboard,
    DepotListResponse,
    DepotUpdate,
    Pagination,
    VehicleServiceSummary,
)
from app.repositories.depot_repository import DepotRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.utils.datetime_utils import utcnow


class DepotService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._depot_repo = DepotRepository(db)
        self._vehicle_repo = VehicleRepository(db)

    async def list_depots(
        self,
        page: int,
        page_size: int,
        search: str | None,
    ) -> DepotListResponse:
        depots, total_items = await self._depot_repo.list_depots(
            page=page,
            page_size=page_size,
            search=search,
        )
        total_pages = max(1, (total_items + page_size - 1) // page_size)
        return DepotListResponse(
            data=[Depot.model_validate(d) for d in depots],
            pagination=Pagination(
                page=page,
                page_size=page_size,
                total_items=total_items,
                total_pages=total_pages,
            ),
        )

    async def get_depot(self, depot_id: UUID) -> Depot:
        depot = await self._depot_repo.get_by_id(depot_id)
        if depot is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "DEPOT_NOT_FOUND", "message": "Depot not found."},
            )
        return Depot.model_validate(depot)

    async def create_depot(self, body: DepotCreate) -> Depot:
        existing = await self._depot_repo.get_by_name(body.name)
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "DEPOT_NAME_CONFLICT",
                    "message": "A depot with this name already exists.",
                },
            )
        depot = await self._depot_repo.create(body)
        return Depot.model_validate(depot)

    async def update_depot(self, depot_id: UUID, body: DepotUpdate) -> Depot:
        depot = await self._depot_repo.get_by_id(depot_id)
        if depot is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "DEPOT_NOT_FOUND", "message": "Depot not found."},
            )
        if body.name is not None and body.name != depot.name:
            existing = await self._depot_repo.get_by_name(body.name)
            if existing is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "code": "DEPOT_NAME_CONFLICT",
                        "message": "A depot with this name already exists.",
                    },
                )
        updated = await self._depot_repo.update(depot, body)
        return Depot.model_validate(updated)

    async def delete_depot(self, depot_id: UUID) -> None:
        depot = await self._depot_repo.get_by_id(depot_id)
        if depot is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "DEPOT_NOT_FOUND", "message": "Depot not found."},
            )
        try:
            await self._depot_repo.delete(depot)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "DEPOT_HAS_REFERENCES",
                    "message": "Cannot delete depot because it has associated records.",
                },
            ) from exc

    async def get_depot_dashboard(self, depot_id: UUID) -> DepotDashboard:
        depot = await self._depot_repo.get_by_id(depot_id)
        if depot is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "DEPOT_NOT_FOUND", "message": "Depot not found."},
            )

        vehicles = await self._vehicle_repo.list_by_depot(
            depot_id=depot_id,
            status_filter="active",
        )

        today = utcnow().date()

        due_for_service: list[VehicleServiceSummary] = []
        overdue: list[VehicleServiceSummary] = []

        for vehicle in vehicles:
            next_date = vehicle.next_service_due_date
            next_odo = vehicle.next_service_due_odometer_km
            last_odo = vehicle.last_known_odometer_km

            if next_date is None and next_odo is None:
                continue

            summary = VehicleServiceSummary(
                vehicle_id=vehicle.id,
                registration_number=vehicle.registration_number,
                make=vehicle.make,
                model=vehicle.model,
                last_known_odometer_km=last_odo,
                next_service_due_date=next_date,
                next_service_due_odometer_km=next_odo,
            )

            is_date_overdue = next_date is not None and next_date < today
            is_odo_overdue = (
                next_odo is not None
                and last_odo is not None
                and last_odo >= next_odo
            )

            if is_date_overdue or is_odo_overdue:
                overdue.append(summary)
            else:
                due_for_service.append(summary)

        return DepotDashboard(
            depot_id=depot_id,
            due_for_service=due_for_service,
            overdue=overdue,
        )
