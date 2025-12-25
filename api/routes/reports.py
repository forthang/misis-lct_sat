from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import io
import pandas as pd
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.units import inch

from api.core.database import get_async_session
from api.core.db.review_crud import get_dashboard_stats, get_topic_trends, get_topics_comparison
from api.core.schemas import TopicsStatisticsRequest

router = APIRouter(prefix="/api/reports", tags=["Reports"])


class ReportRequest(BaseModel):
    start_date: str
    end_date: str
    mode: str
    topics: List[str]
    format: str = "excel"  # excel или pdf


def _generate_excel_report(data: Dict[str, Any], topics_data: List[Dict] = None) -> io.BytesIO:
    """Генерирует Excel отчет."""
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        workbook = writer.book
        
        # Форматы
        header_format = workbook.add_format({
            'bold': True, 'bg_color': '#2b61ec', 'font_color': 'white',
            'border': 1, 'align': 'center', 'valign': 'vcenter'
        })
        cell_format = workbook.add_format({'border': 1, 'align': 'center', 'valign': 'vcenter'})
        
        # Лист 1: Общая статистика
        if "overview" in data:
            overview = data["overview"]
            df_overview = pd.DataFrame([{
                "Всего отзывов": overview.get("total_reviews", 0),
                "Средний рейтинг": overview.get("average_rating", "-"),
                "NPS Score": overview.get("nps_score", 0),
            }])
            df_overview.to_excel(writer, sheet_name="Общая статистика", index=False, startrow=1)
            ws = writer.sheets["Общая статистика"]
            ws.write(0, 0, "Общая статистика по отзывам", header_format)
            
            # Распределение тональности
            if "sentiment_distribution" in overview:
                sent_data = overview["sentiment_distribution"]
                df_sent = pd.DataFrame([
                    {"Тональность": k, "Количество": v} for k, v in sent_data.items()
                ])
                df_sent.to_excel(writer, sheet_name="Общая статистика", index=False, startrow=5)
        
        # Лист 2: Топ темы
        if "popular_topics" in data.get("overview", {}):
            topics = data["overview"]["popular_topics"]
            df_topics = pd.DataFrame(topics)
            df_topics.columns = ["Тема", "Количество упоминаний"]
            df_topics.to_excel(writer, sheet_name="Популярные темы", index=False)
        
        # Лист 3: Проблемные темы
        if "problem_topics" in data.get("overview", {}):
            problems = data["overview"]["problem_topics"]
            df_problems = pd.DataFrame(problems)
            if not df_problems.empty:
                df_problems.columns = ["Тема", "Негативных отзывов"]
                df_problems.to_excel(writer, sheet_name="Проблемные темы", index=False)
        
        # Лист 4: Тренды
        if "topic_trends" in data:
            df_trends = pd.DataFrame(data["topic_trends"])
            if not df_trends.empty:
                df_trends.to_excel(writer, sheet_name="Динамика по темам", index=False)
        
        # Лист 5: Сравнение тем (если есть)
        if topics_data:
            df_comparison = pd.DataFrame(topics_data)
            df_comparison.to_excel(writer, sheet_name="Сравнение тем", index=False)

    output.seek(0)
    return output


def _generate_pdf_report(data: Dict[str, Any], topics_data: List[Dict] = None) -> io.BytesIO:
    """Генерирует PDF отчет."""
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    
    # Регистрируем шрифт с поддержкой кириллицы
    font_path = "/usr/local/lib/python3.13/site-packages/matplotlib/mpl-data/fonts/ttf/DejaVuSans.ttf"
    font_bold_path = "/usr/local/lib/python3.13/site-packages/matplotlib/mpl-data/fonts/ttf/DejaVuSans-Bold.ttf"
    pdfmetrics.registerFont(TTFont('DejaVu', font_path))
    pdfmetrics.registerFont(TTFont('DejaVu-Bold', font_bold_path))
    
    output = io.BytesIO()
    doc = SimpleDocTemplate(output, pagesize=A4, topMargin=30, bottomMargin=30)
    elements = []
    styles = getSampleStyleSheet()
    
    # Стили с кириллическим шрифтом
    title_style = ParagraphStyle('Title', fontName='DejaVu-Bold', fontSize=16, spaceAfter=20, alignment=1)
    heading_style = ParagraphStyle('Heading', fontName='DejaVu-Bold', fontSize=12, spaceAfter=10, spaceBefore=15)
    
    elements.append(Paragraph("Аналитический отчет по отзывам Газпромбанка", title_style))
    elements.append(Spacer(1, 10))
    
    # Общая статистика
    if "overview" in data:
        overview = data["overview"]
        elements.append(Paragraph("1. Общая статистика", heading_style))
        
        stats_data = [
            ["Показатель", "Значение"],
            ["Всего отзывов", str(overview.get("total_reviews", 0))],
            ["Средний рейтинг", f"{overview.get('average_rating', 0):.2f}" if overview.get('average_rating') else "-"],
            ["NPS Score", f"{overview.get('nps_score', 0):.1f}"],
            ["Всего упоминаний тем", str(overview.get("total_mentions", 0))],
        ]
        
        table = Table(stats_data, colWidths=[250, 150])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2b61ec')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), 'DejaVu'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 15))
        
        # Распределение тональности
        if "sentiment_distribution" in overview:
            elements.append(Paragraph("2. Распределение тональности", heading_style))
            sent_data = [["Тональность", "Количество", "Процент"]]
            total = sum(overview["sentiment_distribution"].values()) or 1
            for k, v in overview["sentiment_distribution"].items():
                pct = (v / total) * 100
                sent_data.append([k, str(v), f"{pct:.1f}%"])
            
            sent_table = Table(sent_data, colWidths=[150, 100, 100])
            sent_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#06D6A0')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, -1), 'DejaVu'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(sent_table)
            elements.append(Spacer(1, 15))
        
        # Популярные темы
        if "popular_topics" in overview and overview["popular_topics"]:
            elements.append(Paragraph("3. Популярные темы", heading_style))
            topics_table_data = [["#", "Тема", "Упоминаний"]]
            for i, t in enumerate(overview["popular_topics"][:10], 1):
                topics_table_data.append([str(i), t["topic"], str(t["count"])])
            
            topics_table = Table(topics_table_data, colWidths=[30, 250, 100])
            topics_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#FF6B35')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, -1), 'DejaVu'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(topics_table)
            elements.append(Spacer(1, 15))
        
        # Проблемные темы
        if "problem_topics" in overview and overview["problem_topics"]:
            elements.append(Paragraph("4. Проблемные темы (негативные отзывы)", heading_style))
            problem_data = [["#", "Тема", "Негативных"]]
            for i, t in enumerate(overview["problem_topics"][:10], 1):
                problem_data.append([str(i), t["topic"], str(t["negative_count"])])
            
            problem_table = Table(problem_data, colWidths=[30, 250, 100])
            problem_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#EF476F')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, -1), 'DejaVu'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(problem_table)
    
    # Тренды
    if "topic_trends" in data and data["topic_trends"]:
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("5. Динамика по темам", heading_style))
        trends_data = [["Период", "Тема", "Количество", "Sentiment Score"]]
        for t in data["topic_trends"][:20]:
            trends_data.append([
                t.get("period", ""),
                t.get("topic", ""),
                str(t.get("count", 0)),
                f"{t.get('sentiment_score', 0):.2f}"
            ])
        
        trends_table = Table(trends_data, colWidths=[80, 150, 80, 80])
        trends_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#118AB2')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), 'DejaVu'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(trends_table)
    
    doc.build(elements)
    output.seek(0)
    return output


@router.post("/generate")
async def generate_report(
    request: ReportRequest,
    session: AsyncSession = Depends(get_async_session),
):
    """Генерирует отчет в формате PDF или Excel."""
    try:
        from datetime import datetime
        
        start_date = datetime.fromisoformat(request.start_date.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(request.end_date.replace('Z', '+00:00'))
        
        # Получаем данные
        overview_stats = await get_dashboard_stats(
            session=session,
            start_date=start_date,
            end_date=end_date,
            mode=request.mode,
        )
        
        topic_trends = await get_topic_trends(
            session=session,
            start_date=start_date,
            end_date=end_date,
            mode=request.mode,
        )
        
        # Сравнение тем если указаны
        topics_comparison = None
        if request.topics and request.topics[0] not in ["excel", "pdf"]:
            topics_comparison = await get_topics_comparison(
                session=session,
                start_date=start_date,
                end_date=end_date,
                topic_names=request.topics,
            )

        report_data = {
            "overview": overview_stats,
            "topic_trends": topic_trends,
        }
        
        # Определяем формат
        file_format = request.format
        if request.topics and request.topics[0] in ["excel", "pdf"]:
            file_format = request.topics[0]

        if file_format == "pdf":
            file_buffer = _generate_pdf_report(report_data, topics_comparison)
            media_type = "application/pdf"
            filename = "report.pdf"
        else:
            file_buffer = _generate_excel_report(report_data, topics_comparison)
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            filename = "report.xlsx"

        return StreamingResponse(
            file_buffer,
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка генерации отчета: {str(e)}")
