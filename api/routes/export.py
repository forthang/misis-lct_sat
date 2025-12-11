from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
import io
import pandas as pd

from api.core.database import get_async_session
from api.core.db.review_crud import get_all_reviews_for_export

router = APIRouter(prefix="/api/export", tags=["Export"])

@router.get("/reviews")
async def export_reviews_to_csv(
    session: AsyncSession = Depends(get_async_session),
):
    """
    Экспортирует все отзывы в формате CSV для BI систем.
    """
    try:
        reviews_data = await get_all_reviews_for_export(session)
        if not reviews_data:
            raise HTTPException(status_code=404, detail="Нет данных для экспорта.")

        df = pd.DataFrame(reviews_data)
        
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        
        return StreamingResponse(
            io.BytesIO(output.read().encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=reviews_export.csv"}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
