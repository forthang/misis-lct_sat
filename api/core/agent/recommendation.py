from api.core.agent.prompts import GENERATE_RECOMMENDATIONS_PROMPT
from api.core.agent.utils import llm

async def get_recommendations_for_reviews(topic: str, reviews: list[str]) -> str:
    """
    Генерирует рекомендации на основе списка негативных отзывов.
    """
    if not reviews:
        return "Недостаточно данных для генерации рекомендаций."

    formatted_reviews = "\n\n---\n\n".join(reviews)
    
    prompt = GENERATE_RECOMMENDATIONS_PROMPT.format(
        topic=topic,
        reviews=formatted_reviews
    )

    response = await llm.ainvoke(prompt)
    
    return response.content
