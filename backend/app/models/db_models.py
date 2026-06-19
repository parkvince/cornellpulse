from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Text, ARRAY, Boolean
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


class PeerSignup(Base):
    __tablename__ = "peer_signups"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    email = Column(String(200), nullable=False)
    phone = Column(String(50), nullable=False)
    year = Column(String(50), nullable=False)
    major = Column(String(200))
    locations = Column(JSONB, default=list)
    availability = Column(JSONB, default=list)
    interests = Column(JSONB, default=list)
    about = Column(Text)
    ref_name = Column(String(200), nullable=False)
    ref_phone = Column(String(50), nullable=False)
    ref_email = Column(String(200), nullable=False)
    ref_relationship = Column(String(200))
    approved = Column(Boolean, default=False)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())


class PeerConnectRequest(Base):
    __tablename__ = "peer_connect_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    supporter_name = Column(String(200), nullable=False)
    requester_name = Column(String(200), nullable=False)
    requester_email = Column(String(200), nullable=False)
    requester_phone = Column(String(50))
    preferred_location = Column(String(200), nullable=False)
    preferred_time = Column(String(100), nullable=False)
    message = Column(Text)
    status = Column(String(50), default="pending")
    requested_at = Column(DateTime(timezone=True), server_default=func.now())

    class ResourceClick(Base):
    __tablename__ = "resource_clicks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    resource_id = Column(String(100), nullable=False)
    action = Column(String(20), nullable=False)
    clicked_at = Column(DateTime(timezone=True), server_default=func.now())


    class SupporterReport(Base):
    __tablename__ = "supporter_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    supporter_name = Column(String(200), nullable=False)
    reporter_email = Column(String(200))
    reason = Column(Text, nullable=False)
    reported_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved = Column(Boolean, default=False)