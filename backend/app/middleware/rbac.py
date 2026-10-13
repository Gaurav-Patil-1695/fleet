"""Role-based access control dependency for FastAPI route handlers.

The `require_role` factory is the ONLY place where role checks are defined.
Every router imports and injects it; service and repository layers must never
perform role checks.
"""

from typing import List

from fastapi import Depends, HTTPException, status

from app.middleware.auth_middleware import get_current_token_payload


def require_role(*roles: str):
    """
    FastAPI dependency factory that enforces role-based access control.

    Usage::

        @router.get("/some-path", dependencies=[Depends(require_role("administrator", "manager"))])
        async def some_handler(...):
            ...

    Or as an injected dependency::

        async def some_handler(
            payload: dict = Depends(require_role("administrator")),
        ):
            ...

    Parameters
    ----------
    *roles:
        One or more role strings from the set {"administrator", "manager", "technician"}.
        The authenticated user must possess at least one of the listed roles.

    Returns
    -------
    A FastAPI dependency callable that resolves to the decoded JWT payload dict
    when the role check passes, or raises HTTP 401 / 403 otherwise.
    """
    allowed: List[str] = list(roles)

    async def _check_role(
        payload: dict = Depends(get_current_token_payload),
    ) -> dict:
        """
        Inner dependency resolved by FastAPI.

        Raises HTTP 403 if the authenticated user's role is not in `allowed`.
        Returns the decoded JWT payload on success.
        """
        user_role: str = payload.get("role", "")
        if user_role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return payload

    return _check_role
