from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.middleware.error_handlers import register_error_handlers
from app.modules.auth.router import router as auth_router
from app.modules.depots.router import router as depots_router
from app.modules.vehicle_types.router import router as vehicle_types_router
from app.modules.schedules.router import router as schedules_router
from app.modules.vehicles.router import router as vehicles_router
from app.modules.readings.router import router as readings_router
from app.modules.work_orders.router import router as work_orders_router
from app.modules.telematics.router import router as telematics_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="Fleet Maintenance API",
        version="1.0.0",
        docs_url="/docs" if settings.APP_ENV != "production" else None,
        redoc_url="/redoc" if settings.APP_ENV != "production" else None,
    )

    # CORS middleware
    cors_origins = [
        origin.strip()
        for origin in settings.CORS_ALLOWED_ORIGINS.split(",")
        if origin.strip()
    ]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Error handlers
    register_error_handlers(app)

    # Routers — all mounted under /v1
    app.include_router(auth_router, prefix="/v1")
    app.include_router(depots_router, prefix="/v1")
    app.include_router(vehicle_types_router, prefix="/v1")
    app.include_router(schedules_router, prefix="/v1")
    app.include_router(vehicles_router, prefix="/v1")
    app.include_router(readings_router, prefix="/v1")
    app.include_router(work_orders_router, prefix="/v1")
    app.include_router(telematics_router, prefix="/v1")

    return app


app = create_app()
