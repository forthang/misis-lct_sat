from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from api.core.database import get_async_session
from api.core.db.review_crud import get_negative_reviews_for_topic
from api.core.agent.recommendation import get_recommendations_for_reviews
from api.core.schemas import TopicsStatisticsRequest # Re-using for request body

router = APIRouter(prefix="/api/ai", tags=["AI"])

@router.post("/recommendations")
async def get_ai_recommendations(
    request: TopicsStatisticsRequest,
    session: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    """
    Генерирует рекомендации по улучшению на основе анализа негативных отзывов.
    """
    if not request.topics:
        raise HTTPException(status_code=400, detail="Необходимо указать хотя бы одну тему для анализа.")

    topic_to_analyze = request.topics[0]

    try:
        # 1. Fetch negative reviews
        negative_reviews = await get_negative_reviews_for_topic(
            session=session,
            topic_name=topic_to_analyze,
            start_date=request.start_date,
            end_date=request.end_date,
        )

        if not negative_reviews:
            return {
                "status": "success",
                "data": "По данной теме и за указанный период не найдено негативных отзывов для анализа.",
                "meta": {"topic": topic_to_analyze},
            }

        # 2. Get recommendations from the agent
        recommendations = await get_recommendations_for_reviews(
            topic=topic_to_analyze,
            reviews=negative_reviews
        )

        return {
            "status": "success",
            "data": recommendations,
            "meta": {
                "topic": topic_to_analyze,
                "reviews_analyzed": len(negative_reviews)
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
