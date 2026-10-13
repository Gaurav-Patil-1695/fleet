"""Shared FastAPI dependency callables: get_db session, get_current_user, require_role."""

from collections.abc import AsyncGenerator
from typing import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.utils.security import decode_access_token

_bearer_scheme = HTTPBearer(auto_error=True)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async database session and close it when done."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Decode the bearer JWT and return the matching active User."""
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": "Invalid or expired token"},
        )

    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": "Token subject missing"},
        )

    repo = UserRepository(db)
    user = await repo.get_by_id(int(user_id))
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "USER_NOT_FOUND", "message": "User not found or inactive"},
        )

    return user


def require_role(*roles: str) -> Callable:
    """Return a FastAPI dependency that enforces one of the given roles.

    NOTE: ``require_role`` is defined here (app.dependencies) and re-exported
    from app.middleware.rbac so that every caller imports it from rbac as the
    naming contract demands, while the actual implementation lives here to
    satisfy the module-map placement rule.
    """

    async def _check_role(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "FORBIDDEN",
                    "message": "You do not have permission to perform this action",
                },
            )
        return current_user

    return _check_role
