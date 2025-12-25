"""Утилиты для агента."""

import asyncio
import json
import re
from collections.abc import Callable
from types import SimpleNamespace
from typing import Any

from langchain_core.messages import AIMessage
from langchain_community.chat_models.gigachat import GigaChat

from api.core.settings import settings


class LLM:
    """Обертка над GigaChat моделью."""

    def __init__(self) -> None:
        self.llm = None
        self._initialized = False

    def _ensure_initialized(self) -> None:
        """Инициализация модели при первом использовании."""
        if self._initialized and self.llm is not None:
            return
        
        self.llm = GigaChat(
            credentials=settings.GIGACHAT_CREDENTIALS,
            model=settings.GIGACHAT_MODEL,
            verify_ssl_certs=False,
        )
        self._initialized = True

    async def ainvoke(self, prompt: str) -> Any:
        """Асинхронный вызов модели."""
        self._ensure_initialized()
        # GigaChat не имеет нативного async, используем sync в executor
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, self.llm.invoke, prompt)
        return response


def format_reviews(reviews: list[str]) -> str:
    """Форматирование списка отзывов в читаемый текст."""
    formatted_reviews = ""
    for i, review in enumerate(reviews, 1):
        formatted_reviews += f"\n{i}. Отзыв (ID={i}):\n{review}\n"
        formatted_reviews += "-" * 50 + "\n"
    return formatted_reviews


def format_reviews_with_categories(reviews: list[str], categories: list[list[str]]) -> str:
    """Форматирование списка отзывов с категориями."""
    formatted_reviews = ""
    for i, (review, cats) in enumerate(zip(reviews, categories, strict=True), 1):
        formatted_reviews += f"\n{i}. Отзыв (ID={i}):\n"
        formatted_reviews += f"Категории: {', '.join(cats)}\n"
        formatted_reviews += f"Текст: {review}\n"
        formatted_reviews += "-" * 50 + "\n"
    return formatted_reviews


def clean_json_response(response: AIMessage) -> str:
    """Очистить ответ от markdown форматирования и извлечь JSON."""
    content = response.content
    content = re.sub(r"```json\s*", "", content)
    content = re.sub(r"```\s*", "", content)
    content = content.strip()

    json_match = re.search(r"\{.*\}", content, re.DOTALL)
    if json_match:
        content = json_match.group(0)

    return content


def parse_review_categories(response: AIMessage) -> list[list[str]]:
    """Парсинг ответа модели в список категорий для каждого отзыва."""
    try:
        content = clean_json_response(response)
        data = json.loads(content)
        reviews = data["reviews"]
        reviews.sort(key=lambda x: x["review_id"])

        reviews_categories = []
        for review in reviews:
            categories = review["categories"]
            categories_normalized = [category.title().strip() for category in categories]
            reviews_categories.append(categories_normalized)
        return reviews_categories

    except Exception as e:
        raise ValueError(f"Ошибка парсинга категорий: {e}") from e


def parse_review_sentiments(response: AIMessage) -> list[dict[str, str]]:
    """Парсинг ответа модели в список тональностей для каждого отзыва."""
    try:
        content = clean_json_response(response)
        data = json.loads(content)
        reviews = data["reviews"]
        reviews.sort(key=lambda x: x["review_id"])

        reviews_sentiments = []
        for review in reviews:
            sentiments = review["sentiments"]

            normalized_sentiments = {}
            for category, sentiment in sentiments.items():
                sentiment_normalized = sentiment.lower().strip()

                if sentiment_normalized not in ["положительно", "нейтрально", "отрицательно"]:
                    sentiment_normalized = "нейтрально"

                normalized_sentiments[category] = sentiment_normalized

            reviews_sentiments.append(normalized_sentiments)

        return reviews_sentiments

    except Exception as e:
        raise ValueError(f"Ошибка парсинга тональностей: {e}") from e


# Синглтон
llm = LLM()