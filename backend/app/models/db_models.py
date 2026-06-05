from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Text, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import uuid

Base = declarative_base()

class CollegeHourAggregate(Base):
    __tablename__ = "college_hour_aggregates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    college = Column(String(50), nullable=False)
    hour_bucket = Column(DateTime(timezone=True), nullable=False)
    check_in_count = Column(Integer, default=0, nullable=False)
    mood_sum = Column(Integer, default=0, nullable=False)
    sleep_score_sum = Column(Float, default=0, nullable=False)
    workload_score_sum = Column(Float, default=0, nullable=False)
    distress_level_high = Column(Integer, default=0, nullable=False)
    distress_level_mod = Column(Integer, default=0, nullable=False)
    distress_level_low = Column(Integer, default=0, nullable=False)
    resource_routed = Column(JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())


class CampusHourAggregate(Base):
    __tablename__ = "campus_hour_aggregates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    hour_bucket = Column(DateTime(timezone=True), nullable=False, unique=True)
    check_in_count = Column(Integer, default=0, nullable=False)
    mood_sum = Column(Integer, default=0, nullable=False)
    sleep_score_sum = Column(Float, default=0, nullable=False)
    workload_score_sum = Column(Float, default=0, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now())


class PushSubscriber(Base):
    __tablename__ = "push_subscribers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subscription = Column(JSONB, nullable=False)
    college = Column(String(50))
    subscribed_at = Column(DateTime(timezone=True), server_default=func.now())
    last_notified_at = Column(DateTime(timezone=True))


class AcademicCalendarEvent(Base):
    __tablename__ = "academic_calendar_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_type = Column(String(50), nullable=False)
    event_name = Column(Text, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    colleges = Column(ARRAY(Text))
    fetched_at = Column(DateTime(timezone=True), server_default=func.now())