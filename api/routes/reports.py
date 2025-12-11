from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
import io
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from api.core.database import get_async_session
from api.core.db.review_crud import get_dashboard_stats, get_topic_trends
from api.core.schemas import TopicsStatisticsRequest

router = APIRouter(prefix="/api/reports", tags=["Reports"])

def _generate_excel_report(data: Dict[str, Any]) -> io.BytesIO:
    """
    Generates an Excel report from a dictionary of dataframes.
    """
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        for sheet_name, df_data in data.items():
            if isinstance(df_data, list) and df_data:
                df = pd.DataFrame(df_data)
                df.to_excel(writer, sheet_name=sheet_name, index=False)
            elif isinstance(df_data, dict):
                df = pd.DataFrame([df_data])
                df.to_excel(writer, sheet_name=sheet_name, index=False)

    output.seek(0)
    return output

def _generate_pdf_report(data: Dict[str, Any]) -> io.BytesIO:
    """
    Generates a simple PDF report.
    """
    output = io.BytesIO()
    c = canvas.Canvas(output, pagesize=letter)
    width, height = letter
    
    y_position = height - 40
    
    c.drawString(30, y_position, "Аналитический отчет по отзывам")
    y_position -= 20

    for title, content in data.items():
        if y_position < 100:
            c.showPage()
            y_position = height - 40

        c.drawString(30, y_position, title)
        y_position -= 15

        if isinstance(content, list) and content:
            df = pd.DataFrame(content)
            text = df.to_string()
        elif isinstance(content, dict):
            df = pd.DataFrame([content])
            text = df.to_string()
        else:
            text = str(content)

        text_object = c.beginText(40, y_position)
        for line in text.split('\n'):
            text_object.textLine(line)
            if text_object.getY() < 100:
                c.drawText(text_object)
                c.showPage()
                text_object = c.beginText(40, height - 40)
        
        c.drawText(text_object)
        y_position = text_object.getY() - 20


    c.save()
    output.seek(0)
    return output

@router.post("/generate")
async def generate_report(
    request: TopicsStatisticsRequest,
    session: AsyncSession = Depends(get_async_session),
):
    """
    Генерирует отчет в формате PDF или Excel на основе заданных параметров.
    """
    try:
        overview_stats = await get_dashboard_stats(
            session=session,
            start_date=request.start_date,
            end_date=request.end_date,
            mode=request.mode,
        )
        
        topic_trends = await get_topic_trends(
            session=session,
            start_date=request.start_date,
            end_date=request.end_date,
            mode=request.mode,
        )

        report_data = {
            "Общая статистика": overview_stats,
            "Тренды по темам": topic_trends
        }
        
        file_format = request.topics[0] if request.topics else "excel" # Using topics field to pass format for now

        if file_format == "pdf":
            file_buffer = _generate_pdf_report(report_data)
            media_type = "application/pdf"
            filename = "report.pdf"
        else: # Default to excel
            file_buffer = _generate_excel_report(report_data)
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            filename = "report.xlsx"

        return StreamingResponse(
            file_buffer,
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
