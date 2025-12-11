from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Text,
)
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class CompetitorReview(Base):
    __tablename__ = "competitor_reviews"

    id = Column(Integer, primary_key=True, index=True)
    bank_name = Column(String(100), nullable=False, index=True)
    text = Column(Text, nullable=False)
    date = Column(DateTime(timezone=True), nullable=False, index=True)
    rating = Column(Integer, nullable=True)
    # For simplicity in this mock feature, we won't create full topic/sentiment relationships
    # and will just store them as raw strings.
    topics = Column(String) # e.g., "deposits,mobile_app"
    sentiments = Column(String) # e.g., "положительно,положительно"
