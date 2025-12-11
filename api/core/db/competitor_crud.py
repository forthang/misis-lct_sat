from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Dict, Any
from datetime import datetime

from api.core.competitor_models import CompetitorReview
from api.core.models import Review, ReviewTopic, Sentiment, Topic # For NPS calculation of main bank

async def get_competitor_comparison_stats(
    session: AsyncSession,
    start_date: datetime,
    end_date: datetime,
    bank_names: List[str]
) -> List[Dict[str, Any]]:
    """
    Calculates and compares key metrics for specified competitor banks
    and Gazprombank within a given date range.
    """
    stats = []

    # Add Gazprombank to the list for comparison
    all_banks_to_compare = ["Gazprombank"] + bank_names

    for bank in all_banks_to_compare:
        bank_stat = {
            "bank_name": bank,
            "total_reviews": 0,
            "average_rating": None,
            "nps_score": 0
        }

        if bank == "Gazprombank":
            # Calculate stats for Gazprombank from the main tables
            total_reviews = await session.scalar(
                select(func.count(Review.id)).where(
                    Review.date.between(start_date, end_date)
                )
            )
            avg_rating = await session.scalar(
                select(func.avg(Review.rating)).where(
                    Review.date.between(start_date, end_date),
                    Review.rating.isnot(None)
                )
            )
            sentiment_counts_query = await session.execute(
                select(ReviewTopic.sentiment, func.count(ReviewTopic.review_id))
                .join(Review, ReviewTopic.review_id == Review.id)
                .where(Review.date.between(start_date, end_date))
                .group_by(ReviewTopic.sentiment)
            )
            sentiment_counts = {s.value: c for s, c in sentiment_counts_query}
            
            bank_stat["total_reviews"] = total_reviews
            bank_stat["average_rating"] = float(avg_rating) if avg_rating else None

        else:
            # Calculate stats for competitor banks
            total_reviews = await session.scalar(
                select(func.count(CompetitorReview.id)).where(
                    CompetitorReview.bank_name == bank,
                    CompetitorReview.date.between(start_date, end_date)
                )
            )
            avg_rating = await session.scalar(
                select(func.avg(CompetitorReview.rating)).where(
                    CompetitorReview.bank_name == bank,
                    CompetitorReview.date.between(start_date, end_date),
                    CompetitorReview.rating.isnot(None)
                )
            )
            # Simplified sentiment calculation for competitors
            sentiments_query = await session.execute(
                select(CompetitorReview.sentiments).where(
                    CompetitorReview.bank_name == bank,
                    CompetitorReview.date.between(start_date, end_date)
                )
            )
            sentiment_list = [s for (s,) in sentiments_query if s]
            
            all_sentiments = [s.strip() for slist in sentiment_list for s in slist.split(',')]
            
            sentiment_counts = {
                "положительно": all_sentiments.count("положительно"),
                "отрицательно": all_sentiments.count("отрицательно"),
                "нейтрально": all_sentiments.count("нейтрально")
            }

            bank_stat["total_reviews"] = total_reviews
            bank_stat["average_rating"] = float(avg_rating) if avg_rating else None

        # Calculate NPS
        total_mentions = sum(sentiment_counts.values())
        if total_mentions > 0:
            positive = sentiment_counts.get("положительно", 0)
            negative = sentiment_counts.get("отрицательно", 0)
            bank_stat["nps_score"] = round(((positive - negative) / total_mentions) * 100, 2)
            
        stats.append(bank_stat)

    return stats
