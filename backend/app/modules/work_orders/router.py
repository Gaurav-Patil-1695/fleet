from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.middleware.rbac import require_role
from app.models.user import User
from app.modules.work_orders.schemas import (
    WorkOrderAssign,
    WorkOrderClose,
    WorkOrderCreate,
    WorkOrderListResponse,
    WorkOrderUpdate,
)
from app.modules.work_orders.schemas import WorkOrder as WorkOrderSchema
from app.modules.work_orders import service as work_order_service

router = APIRouter(prefix="/work-orders", tags=["work-orders"])


@router.get(
    "/my",
    response_model=WorkOrderListResponse,
    dependencies=[Depends(require_role(["technician"]))],
)
async def list_my_work_orders(
    page: str = Query(default="1"),
    page_size: str = Query(default="20"),
    status: str = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WorkOrderListResponse:
    return await work_order_service.list_my_work_orders(
        db=db,
        current_user=current_user,
        page=page,
        page_size=page_size,
        status=status,
    )


@router.get(
    "",
    response_model=WorkOrderListResponse,
    dependencies=[Depends(require_role(["manager", "technician"]))],
)
async def list_work_orders(
    page: str = Query(default="1"),
    page_size: str = Query(default="20"),
    status: str = Query(default=None),
    depot_id: str = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WorkOrderListResponse:
    return await work_order_service.list_work_orders(
        db=db,
        current_user=current_user,
        page=page,
        page_size=page_size,
        status=status,
        depot_id=depot_id,
    )


@router.post(
    "",
    response_model=WorkOrderSchema,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(["administrator", "manager"]))],
)
async def create_work_order(
    body: WorkOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WorkOrderSchema:
    return await work_order_service.create_work_order(
        db=db,
        body=body,
        current_user=current_user,
    )


@router.get(
    "/{work_order_id}",
    response_model=WorkOrderSchema,
    dependencies=[Depends(require_role(["administrator", "manager", "technician"]))],
)
async def get_work_order(
    work_order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WorkOrderSchema:
    return await work_order_service.get_work_order(
        db=db,
        work_order_id=work_order_id,
        current_user=current_user,
    )


@router.put(
    "/{work_order_id}",
    response_model=WorkOrderSchema,
    dependencies=[Depends(require_role(["administrator", "manager"]))],
)
async def update_work_order(
    work_order_id: UUID,
    body: WorkOrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WorkOrderSchema:
    return await work_order_service.update_work_order(
        db=db,
        work_order_id=work_order_id,
        body=body,
        current_user=current_user,
    )


@router.delete(
    "/{work_order_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role(["administrator"]))],
)
async def delete_work_order(
    work_order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    await work_order_service.delete_work_order(
        db=db,
        work_order_id=work_order_id,
        current_user=current_user,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{work_order_id}/close",
    response_model=WorkOrderSchema,
    dependencies=[Depends(require_role(["technician"]))],
)
async def close_work_order(
    work_order_id: UUID,
    body: WorkOrderClose,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WorkOrderSchema:
    return await work_order_service.close_work_order(
        db=db,
        work_order_id=work_order_id,
        body=body,
        current_user=current_user,
    )


@router.post(
    "/{work_order_id}/assign",
    response_model=WorkOrderSchema,
    dependencies=[Depends(require_role(["administrator", "manager"]))],
)
async def assign_work_order(
    work_order_id: UUID,
    body: WorkOrderAssign,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WorkOrderSchema:
    return await work_order_service.assign_work_order(
        db=db,
        work_order_id=work_order_id,
        body=body,
        current_user=current_user,
    )
