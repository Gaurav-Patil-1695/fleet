from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rbac import require_role
from app.modules.depots.schemas import (
    Depot,
    DepotCreate,
    DepotDashboard,
    DepotListResponse,
    DepotUpdate,
)
from app.modules.depots.service import DepotService

router = APIRouter(prefix="/depots", tags=["depots"])


@router.get("", response_model=DepotListResponse, status_code=status.HTTP_200_OK)
async def list_depots(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: object = Depends(require_role("administrator", "manager")),
) -> DepotListResponse:
    service = DepotService(db)
    return await service.list_depots(page=page, page_size=page_size, search=search)


@router.post("", response_model=Depot, status_code=status.HTTP_201_CREATED)
async def create_depot(
    body: DepotCreate,
    db: AsyncSession = Depends(get_db),
    current_user: object = Depends(require_role("administrator")),
) -> Depot:
    service = DepotService(db)
    return await service.create_depot(body)


@router.get("/my", include_in_schema=False)
async def _placeholder() -> None:
    pass


@router.get("/{depot_id}", response_model=Depot, status_code=status.HTTP_200_OK)
async def get_depot(
    depot_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: object = Depends(require_role("administrator", "manager")),
) -> Depot:
    service = DepotService(db)
    return await service.get_depot(depot_id)


@router.put("/{depot_id}", response_model=Depot, status_code=status.HTTP_200_OK)
async def update_depot(
    depot_id: UUID,
    body: DepotUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: object = Depends(require_role("administrator")),
) -> Depot:
    service = DepotService(db)
    return await service.update_depot(depot_id, body)


@router.delete("/{depot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_depot(
    depot_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: object = Depends(require_role("administrator")),
) -> None:
    service = DepotService(db)
    await service.delete_depot(depot_id)


@router.get(
    "/{depot_id}/dashboard",
    response_model=DepotDashboard,
    status_code=status.HTTP_200_OK,
)
async def get_depot_dashboard(
    depot_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: object = Depends(require_role("manager", "technician")),
) -> DepotDashboard:
    service = DepotService(db)
    return await service.get_depot_dashboard(depot_id)
