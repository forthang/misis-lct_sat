import json
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from typing import AsyncGenerator
from datetime import datetime

from api.core.settings import DATABASE_URL
from api.core.models import Base as MainBase
from api.core.db.review_crud import create_reviews_from_json_list
from api.core.competitor_models import Base as CompetitorBase, CompetitorReview


engine = create_async_engine(DATABASE_URL, echo=True, future=True)
async_session_maker = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

JSON_PATH = Path(__file__).parent.parent / "transformed_reviews.json"
COMPETITOR_JSON_PATH = Path(__file__).parent.parent / "competitor_reviews.json"

async def create_competitor_reviews_from_json(session: AsyncSession, reviews_data: list):
    """Seeds competitor reviews from JSON."""
    for review_data in reviews_data:
        existing = await session.get(CompetitorReview, review_data["id"])
        if not existing:
            review = CompetitorReview(
                id=review_data["id"],
                bank_name=review_data["bank_name"],
                text=review_data["text"],
                date=datetime.strptime(review_data["date"], "%Y-%m-%d %H:%M:%S"),
                rating=review_data.get("rating"),
                topics=",".join(review_data.get("review_topics", [])),
                sentiments=",".join(review_data.get("sentiments", [])),
            )
            session.add(review)
    await session.commit()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(MainBase.metadata.create_all)
        await conn.run_sync(CompetitorBase.metadata.create_all)

    async with async_session_maker() as session:
        if JSON_PATH.exists():
            with open(JSON_PATH, "r", encoding="utf-8") as f:
                reviews_data = json.load(f)
            await create_reviews_from_json_list(session, reviews_data)
        
        if COMPETITOR_JSON_PATH.exists():
            with open(COMPETITOR_JSON_PATH, "r", encoding="utf-8") as f:
                competitor_data = json.load(f)
            await create_competitor_reviews_from_json(session, competitor_data)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session
