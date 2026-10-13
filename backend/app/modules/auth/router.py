from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.middleware.rbac import require_role
from app.models.user import User
from app.modules.auth.schemas import LoginRequest, RefreshRequest, TokenResponse
from app.modules.auth.service import (
    login,
    logout,
    refresh_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login_handler(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    return await login(body, db)


@router.post("/refresh", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def refresh_token_handler(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    return await refresh_token(body, db)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[
        Depends(
            require_role(["administrator", "manager", "technician"])
        )
    ],
)
async def logout_handler(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    await logout(current_user, db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/me",
    response_model=None,
    status_code=status.HTTP_200_OK,
    dependencies=[
        Depends(
            require_role(["administrator", "manager", "technician"])
        )
    ],
)
async def get_current_user_handler(
    current_user: User = Depends(get_current_user),
) -> dict:
    from app.modules.auth.schemas import UserResponse
    return UserResponse.model_validate(current_user).model_dump()
