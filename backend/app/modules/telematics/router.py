from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.modules.telematics.schemas import TelematicsIngestRequest, TelematicsIngestResponse
from app.modules.telematics.service import ingest_telematics_readings

router = APIRouter(prefix="/telematics", tags=["telematics"])


@router.post("/ingest", response_model=TelematicsIngestResponse)
async def ingest_telematics_readings_handler(
    body: TelematicsIngestRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TelematicsIngestResponse:
    return await ingest_telematics_readings(body=body, db=db, current_user=current_user)
