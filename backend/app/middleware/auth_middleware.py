"""JWT extraction and verification middleware for protected routes."""

from typing import Optional

from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError

from app.utils.security import decode_access_token


_bearer_scheme = HTTPBearer(auto_error=False)


async def get_token_from_request(request: Request) -> Optional[str]:
    """Extract the Bearer token from the Authorization header, if present."""
    authorization: str = request.headers.get("Authorization", "")
    if authorization.startswith("Bearer "):
        return authorization[len("Bearer "):].strip()
    return None


async def verify_token(token: str) -> dict:
    """
    Decode and verify a JWT access token.

    Returns the decoded payload dict on success.
    Raises HTTP 401 on any verification failure.
    """
    try:
        payload = decode_access_token(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


async def get_current_token_payload(request: Request) -> dict:
    """
    FastAPI dependency: extracts and verifies the JWT from the request.

    Raises HTTP 401 if no token is present or the token is invalid/expired.
    """
    token = await get_token_from_request(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return await verify_token(token)


async def get_optional_token_payload(request: Request) -> Optional[dict]:
    """
    FastAPI dependency: extracts and verifies the JWT from the request.

    Returns None if no token is present; raises HTTP 401 only for
    malformed/expired tokens.
    """
    token = await get_token_from_request(request)
    if not token:
        return None
    return await verify_token(token)
