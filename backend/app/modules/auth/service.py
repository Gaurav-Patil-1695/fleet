from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User
from app.modules.auth.schemas import LoginRequest, RefreshRequest, TokenResponse
from app.repositories.user_repository import get_user_by_email
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)


async def login(body: LoginRequest, db: AsyncSession) -> TokenResponse:
    """Authenticate user with email/password and issue JWT tokens."""
    user = await get_user_by_email(db, body.email)

    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "INVALID_CREDENTIALS",
                "message": "Invalid email or password.",
            },
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "ACCOUNT_INACTIVE", "message": "Account is inactive."},
        )

    token_data = {
        "sub": str(user.id),
        "role": user.role,
        "depot_id": str(user.depot_id) if user.depot_id else None,
    }

    expire_minutes = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    access_token = create_access_token(
        data=token_data,
        expires_delta=timedelta(minutes=expire_minutes),
    )

    refresh_token_str = create_refresh_token(
        data={"sub": str(user.id)},
    )

    return TokenResponse(
        access_token=access_token,
        token_type="Bearer",
        expires_in=expire_minutes * 60,
        refresh_token=refresh_token_str,
    )


async def refresh_token(body: RefreshRequest, db: AsyncSession) -> TokenResponse:
    """Validate a refresh token and issue a new access token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "code": "INVALID_REFRESH_TOKEN",
            "message": "Invalid or expired refresh token.",
        },
    )

    payload = decode_token(body.refresh_token, is_refresh=True)
    if payload is None:
        raise credentials_exception

    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    from app.repositories.user_repository import get_user_by_id

    user = await get_user_by_id(db, user_id)
    if user is None or not user.is_active:
        raise credentials_exception

    token_data = {
        "sub": str(user.id),
        "role": user.role,
        "depot_id": str(user.depot_id) if user.depot_id else None,
    }

    expire_minutes = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    access_token = create_access_token(
        data=token_data,
        expires_delta=timedelta(minutes=expire_minutes),
    )

    new_refresh_token = create_refresh_token(
        data={"sub": str(user.id)},
    )

    return TokenResponse(
        access_token=access_token,
        token_type="Bearer",
        expires_in=expire_minutes * 60,
        refresh_token=new_refresh_token,
    )


async def logout(current_user: User, db: AsyncSession) -> None:
    """Logout the current user (token invalidation is client-side for
    stateless JWTs)."""
    # Stateless JWT: client discards the token.
    # Server-side blocklist can be added here if required.
    return


async def get_current_user_profile(current_user: User) -> User:
    """Return the authenticated user's profile."""
    return current_user
