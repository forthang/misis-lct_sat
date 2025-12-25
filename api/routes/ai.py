from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List
from pydantic import BaseModel

from api.core.database import get_async_session
from api.core.db.review_crud import get_negative_reviews_for_topic, get_topics_negative_stats
from api.core.agent.recommendation import get_recommendations_for_reviews
from api.core.agent.agents import analyze_reviews_full, detect_alerts
from api.core.schemas import TopicsStatisticsRequest

router = APIRouter(prefix="/api/ai", tags=["AI"])


class FullAnalysisRequest(BaseModel):
    topic: str
    start_date: str
    end_date: str


@router.post("/recommendations")
async def get_ai_recommendations(
    request: TopicsStatisticsRequest,
    session: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    """Генерирует рекомендации по улучшению на основе анализа негативных отзывов."""
    if not request.topics:
        raise HTTPException(status_code=400, detail="Необходимо указать хотя бы одну тему для анализа.")

    topic_to_analyze = request.topics[0]

    try:
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

        recommendations = await get_recommendations_for_reviews(
            topic=topic_to_analyze,
            reviews=negative_reviews
        )

        return {
            "status": "success",
            "data": recommendations,
            "meta": {"topic": topic_to_analyze, "reviews_analyzed": len(negative_reviews)},
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/full-analysis")
async def get_full_analysis(
    request: TopicsStatisticsRequest,
    session: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    """Полный анализ: проблемы + рекомендации + резюме."""
    if not request.topics:
        raise HTTPException(status_code=400, detail="Необходимо указать тему для анализа.")

    topic = request.topics[0]

    try:
        negative_reviews = await get_negative_reviews_for_topic(
            session=session,
            topic_name=topic,
            start_date=request.start_date,
            end_date=request.end_date,
        )

        if not negative_reviews:
            return {
                "status": "success",
                "data": {
                    "problems": [],
                    "recommendations": "Нет негативных отзывов для анализа.",
                    "summary": "За выбранный период негативных отзывов не обнаружено."
                },
                "meta": {"topic": topic, "reviews_analyzed": 0},
            }

        analysis = await analyze_reviews_full(topic, negative_reviews)

        return {
            "status": "success",
            "data": analysis,
            "meta": {"topic": topic, "reviews_analyzed": len(negative_reviews)},
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/detect-alerts")
async def get_ai_alerts(
    request: TopicsStatisticsRequest,
    session: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    """Выявление критических ситуаций и аномалий."""
    try:
        topics_data = await get_topics_negative_stats(
            session=session,
            start_date=request.start_date,
            end_date=request.end_date,
        )

        if not topics_data:
            return {
                "status": "success",
                "data": [],
                "meta": {"message": "Нет данных для анализа"},
            }

        alerts = await detect_alerts(topics_data)

        return {
            "status": "success",
            "data": alerts,
            "meta": {"topics_analyzed": len(topics_data)},
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
