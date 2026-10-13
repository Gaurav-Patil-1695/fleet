"""Global exception handlers mapping domain exceptions to HTTP responses."""

import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


def _error_response(
    code: str,
    message: str,
    details: dict | None = None,
    status_code: int = 400,
) -> JSONResponse:
    """Build a JSON response conforming to the Error schema {code, message, details}."""
    body: dict = {"code": code, "message": message}
    if details is not None:
        body["details"] = details
    return JSONResponse(status_code=status_code, content=body)


async def http_exception_handler(
    request: Request,
    exc: StarletteHTTPException,
) -> JSONResponse:
    """Convert Starlette/FastAPI HTTPException into the canonical Error envelope."""
    logger.info(
        "HTTP exception: status=%s detail=%s path=%s",
        exc.status_code,
        exc.detail,
        request.url.path,
    )
    code = f"HTTP_{exc.status_code}"
    message = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    return _error_response(code=code, message=message, status_code=exc.status_code)


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    """Convert Pydantic v2 / FastAPI request-validation errors into the canonical Error envelope."""
    logger.info(
        "Validation error: errors=%s path=%s",
        exc.errors(),
        request.url.path,
    )
    details: dict = {"errors": exc.errors()}
    return _error_response(
        code="VALIDATION_ERROR",
        message="Request validation failed.",
        details=details,
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
    )


async def unhandled_exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    """Catch-all handler that hides internal details from the client and logs
    the real error."""
    logger.exception(
        "Unhandled exception on %s %s",
        request.method,
        request.url.path,
    )
    return _error_response(
        code="INTERNAL_SERVER_ERROR",
        message="An unexpected error occurred. Please try again later.",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def register_error_handlers(app: FastAPI) -> None:
    """Register all global exception handlers on the FastAPI application instance."""
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(RequestValidationError, validation_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, unhandled_exception_handler)  # type: ignore[arg-type]
