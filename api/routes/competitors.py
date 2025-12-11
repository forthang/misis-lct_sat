from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any

from api.core.database import get_async_session
from api.core.db.competitor_crud import get_competitor_comparison_stats
from api.core.schemas import TopicsComparisonRequest # Re-using this schema for the request

router = APIRouter(prefix="/api/competitors", tags=["Competitors"])

@router.post("/compare")
async def compare_competitors(
    request: TopicsComparisonRequest,
    session: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    """
    Сравнивает Газпромбанк с указанными конкурентами по ключевым метрикам.
    """
    if not request.topics:
        raise HTTPException(status_code=400, detail="Список банков-конкурентов не может быть пустым.")

    try:
        comparison_data = await get_competitor_comparison_stats(
            session=session,
            start_date=request.start_date,
            end_date=request.end_date,
            bank_names=request.topics  # Re-using the topics field for bank names
        )
        return {
            "status": "success",
            "data": comparison_data,
            "meta": {
                "start_date": request.start_date.isoformat(),
                "end_date": request.end_date.isoformat(),
                "banks_compared": ["Gazprombank"] + request.topics
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

