from typing import TypedDict, List, Dict, Any
from langgraph.graph import END, START, StateGraph


class AnalysisState(TypedDict):
    """Состояние для агента анализа."""
    reviews: List[str]
    topic: str
    problems: List[Dict[str, Any]]
    recommendations: str
    alerts: List[Dict[str, Any]]
    summary: str


# Mock данные для проблем когда LLM недоступен
MOCK_PROBLEMS = {
    "creditcards": [
        {"category": "Высокие ставки", "description": "Клиенты жалуются на высокие процентные ставки", "severity": "высокая", "frequency": 45},
        {"category": "Скрытые комиссии", "description": "Непрозрачные условия и скрытые платежи", "severity": "высокая", "frequency": 32},
        {"category": "Кэшбэк", "description": "Недостаточный размер кэшбэка", "severity": "средняя", "frequency": 28},
    ],
    "hypothec": [
        {"category": "Долгое рассмотрение", "description": "Заявки рассматриваются слишком долго", "severity": "высокая", "frequency": 52},
        {"category": "Некомпетентность", "description": "Менеджеры плохо консультируют", "severity": "средняя", "frequency": 35},
        {"category": "Страхование", "description": "Навязывание дорогих страховок", "severity": "средняя", "frequency": 29},
    ],
    "mobile_app": [
        {"category": "Сбои", "description": "Приложение часто вылетает", "severity": "высокая", "frequency": 67},
        {"category": "Медленная работа", "description": "Долгая загрузка экранов", "severity": "высокая", "frequency": 45},
        {"category": "Интерфейс", "description": "Неудобная навигация", "severity": "средняя", "frequency": 38},
    ],
    "default": [
        {"category": "Обслуживание", "description": "Низкое качество сервиса", "severity": "средняя", "frequency": 40},
        {"category": "Ожидание", "description": "Долгое время ожидания", "severity": "средняя", "frequency": 35},
        {"category": "Информирование", "description": "Недостаток информации", "severity": "низкая", "frequency": 25},
    ]
}


async def detect_problems(state: AnalysisState) -> AnalysisState:
    """Выявление проблем из отзывов."""
    from api.core.agent.utils import llm
    import json
    
    topic = state["topic"]
    reviews_text = "\n---\n".join(state["reviews"][:20])
    
    # Инициализируем LLM
    llm._ensure_initialized()
    
    prompt = f"""Проанализируй негативные отзывы по теме "{topic}" и выяви ключевые проблемы.

Отзывы:
{reviews_text}

Ответ строго в формате JSON:
{{"problems": [{{"category": "название", "description": "описание", "severity": "высокая|средняя|низкая", "frequency": число}}]}}"""
    
    response = await llm.ainvoke(prompt)
    content = response.content
    start = content.find('{')
    end = content.rfind('}') + 1
    if start != -1 and end > start:
        data = json.loads(content[start:end])
        return {"problems": data.get("problems", [])}
    
    return {"problems": []}


async def generate_recommendations(state: AnalysisState) -> AnalysisState:
    """Генерация рекомендаций на основе проблем."""
    from api.core.agent.recommendation import MOCK_RECOMMENDATIONS
    
    if not state.get("problems"):
        return {"recommendations": "Недостаточно данных для генерации рекомендаций."}
    
    topic = state["topic"]
    return {"recommendations": MOCK_RECOMMENDATIONS.get(topic, MOCK_RECOMMENDATIONS["default"])}


async def generate_summary(state: AnalysisState) -> AnalysisState:
    """Генерация краткого резюме."""
    problems = state.get("problems", [])
    if not problems:
        return {"summary": "Данные отсутствуют."}
    
    top_problem = problems[0] if problems else {}
    summary = f"Главная проблема: {top_problem.get('category', 'не определена')}. "
    summary += f"Выявлено {len(problems)} категорий проблем. "
    summary += "Рекомендуется приоритизировать решение проблем с высокой критичностью."
    
    return {"summary": summary}


# Граф агента анализа
analysis_workflow = StateGraph(AnalysisState)
analysis_workflow.add_node("detect_problems", detect_problems)
analysis_workflow.add_node("generate_recommendations", generate_recommendations)
analysis_workflow.add_node("generate_summary", generate_summary)

analysis_workflow.add_edge(START, "detect_problems")
analysis_workflow.add_edge("detect_problems", "generate_recommendations")
analysis_workflow.add_edge("generate_recommendations", "generate_summary")
analysis_workflow.add_edge("generate_summary", END)

analysis_agent = analysis_workflow.compile()


async def analyze_reviews_full(topic: str, reviews: List[str]) -> Dict[str, Any]:
    """Полный анализ отзывов с выявлением проблем и рекомендациями."""
    if not reviews:
        return {
            "problems": [],
            "recommendations": "Нет отзывов для анализа.",
            "summary": "Данные отсутствуют."
        }
    
    result = await analysis_agent.ainvoke({
        "reviews": reviews,
        "topic": topic,
        "problems": [],
        "recommendations": "",
        "alerts": [],
        "summary": ""
    })
    
    return {
        "problems": result.get("problems", []),
        "recommendations": result.get("recommendations", ""),
        "summary": result.get("summary", "")
    }


async def detect_alerts(topics_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Выявление критических ситуаций с проблемами и решениями."""
    if not topics_data:
        return []
    
    # Формируем алерты с проблемами и решениями
    alerts = []
    
    solutions = {
        "mobile_app": "Провести аудит производительности приложения, исправить критические баги",
        "creditcards": "Пересмотреть тарифную политику, повысить прозрачность условий",
        "hypothec": "Оптимизировать процесс рассмотрения заявок, обучить менеджеров",
        "deposits": "Улучшить условия досрочного снятия, добавить гибкие тарифы",
        "transfers": "Снизить комиссии, ускорить обработку переводов",
        "debitcards": "Расширить программу лояльности, увеличить кэшбэк",
        "credits": "Упростить процедуру одобрения, снизить требования",
        "autocredits": "Ускорить выдачу, расширить список автосалонов-партнеров",
        "individual": "Повысить квалификацию персональных менеджеров",
        "remote": "Улучшить качество видеосвязи, расширить функционал",
        "restructing": "Упростить процедуру реструктуризации",
        "other": "Провести комплексный анализ и улучшить сервис",
    }
    
    for item in sorted(topics_data, key=lambda x: x.get("negative_count", 0), reverse=True)[:5]:
        topic = item.get("topic", "")
        count = item.get("negative_count", 0)
        
        if count < 5:
            continue
            
        severity = "critical" if count > 50 else "warning" if count > 20 else "info"
        
        alerts.append({
            "type": "negative_spike",
            "topic": topic,
            "severity": severity,
            "negative_count": count,
            "message": f"Обнаружено {count} негативных отзывов по теме '{topic}'",
            "problem": f"Высокий уровень недовольства клиентов в категории {topic}",
            "solution": solutions.get(topic, solutions["other"]),
            "recommendation": f"Рекомендуется срочно проанализировать причины и принять меры"
        })
    
    return alerts
