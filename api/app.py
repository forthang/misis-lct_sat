from contextlib import asynccontextmanager
from fastapi import FastAPI
from .routes import reviews, reports, competitors, ai, export
from .core import database
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.init_db()
    yield

app = FastAPI(
    lifespan=lifespan,
    title="Review Analysis API",
    description="API для анализа отзывов Газпромбанка",
    version="1.0.0"
)

# Для локальной разработки разрешаем все origins
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Проверка работоспособности сервиса."""
    return {"status": "ok", "service": "review-analysis-api"}


@app.get("/")
async def root():
    """Корневой эндпоинт."""
    return {
        "message": "Review Analysis API",
        "docs": "/docs",
        "health": "/health"
    }


app.include_router(reviews.router, tags=['reviews'])
app.include_router(reports.router)
app.include_router(competitors.router)
app.include_router(ai.router)
app.include_router(export.router)