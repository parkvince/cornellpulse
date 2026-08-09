from sqlalchemy import Column, Integer, String, DateTime, Date, Text, ARRAY, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import func
import uuid

Base = declarative_base()

class CampusDailyAggregate(Base):
    """A coarse participation count; check-in answers and college/hour dimensions are never stored."""

    __tablename__ = "campus_daily_aggregates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    day_bucket = Column(Date, nullable=False, unique=True)
    check_in_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class AggregateContributionReceipt(Base):
    __tablename__ = "aggregate_contribution_receipts"

    receipt_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contribution_hash = Column(String(64), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)


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
    supporter_id = Column(UUID(as_uuid=True), nullable=False, unique=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    email = Column(String(200), nullable=True)  # Legacy only; new writes use private_data_encrypted.
    phone = Column(String(50), nullable=True)  # Legacy only; new writes use private_data_encrypted.
    year = Column(String(50), nullable=False)
    major = Column(String(200))
    locations = Column(JSONB, default=list)
    availability = Column(JSONB, default=list)
    interests = Column(JSONB, default=list)
    about = Column(Text)
    ref_name = Column(String(200), nullable=True)  # Legacy encrypted-data migration source.
    ref_phone = Column(String(50), nullable=True)
    ref_email = Column(String(200), nullable=True)
    ref_relationship = Column(String(200))
    approved = Column(Boolean, default=False)
    status = Column(String(32), nullable=False, default="draft")
    credential_hash = Column(String(60), nullable=True)
    private_data_encrypted = Column(Text, nullable=True)
    policy_version = Column(String(32), nullable=True)
    policy_accepted_at = Column(DateTime(timezone=True), nullable=True)
    identity_verified_at = Column(DateTime(timezone=True), nullable=True)
    identity_verification_method = Column(String(40), nullable=True)
    identity_subject_hash = Column(String(64), nullable=True)
    identity_verified_by = Column(String(64), nullable=True)
    training_requirements_version = Column(String(32), nullable=True)
    training_modules_completed = Column(JSONB, nullable=False, default=list)
    training_completed_at = Column(DateTime(timezone=True), nullable=True)
    training_evidence_hash = Column(String(64), nullable=True)
    training_verified_by = Column(String(64), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    suspended_at = Column(DateTime(timezone=True), nullable=True)
    rejected_at = Column(DateTime(timezone=True), nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    retention_expires_at = Column(DateTime(timezone=True), nullable=True)
    withdrawn_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class SupporterReferenceInvitation(Base):
    __tablename__ = "supporter_reference_invitations"

    invitation_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supporter_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    token_hash = Column(String(64), nullable=False, unique=True)
    invitee_email_encrypted = Column(Text, nullable=False)
    response_encrypted = Column(Text, nullable=True)
    status = Column(String(32), nullable=False, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    consented_at = Column(DateTime(timezone=True), nullable=True)
    responded_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class PeerRequester(Base):
    __tablename__ = "peer_requesters"

    requester_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    credential_hash = Column(String(60), nullable=True)
    private_data_encrypted = Column(Text, nullable=False)
    status = Column(String(32), nullable=False, default="active")
    identity_verified_at = Column(DateTime(timezone=True), nullable=True)
    identity_verification_method = Column(String(40), nullable=True)
    identity_subject_hash = Column(String(64), nullable=True)
    identity_verified_by = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    retention_expires_at = Column(DateTime(timezone=True), nullable=False)
    withdrawn_at = Column(DateTime(timezone=True), nullable=True)
    suspended_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class PeerConnectRequest(Base):
    __tablename__ = "peer_connect_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(UUID(as_uuid=True), nullable=False, unique=True, default=uuid.uuid4)
    supporter_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    requester_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    supporter_name = Column(String(200), nullable=True)  # Legacy name reference; never used by new writes.
    requester_name = Column(String(200), nullable=True)  # Legacy PII migration source.
    requester_email = Column(String(200), nullable=True)
    requester_phone = Column(String(50))
    preferred_location = Column(String(200), nullable=True)
    preferred_time = Column(String(100), nullable=True)
    message = Column(Text)
    private_data_encrypted = Column(Text, nullable=True)
    status = Column(String(50), default="pending")
    requester_consented_at = Column(DateTime(timezone=True), nullable=True)
    supporter_consented_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    declined_at = Column(DateTime(timezone=True), nullable=True)
    canceled_at = Column(DateTime(timezone=True), nullable=True)
    blocked_at = Column(DateTime(timezone=True), nullable=True)
    unavailable_at = Column(DateTime(timezone=True), nullable=True)
    last_relay_at = Column(DateTime(timezone=True), nullable=True)
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    retention_expires_at = Column(DateTime(timezone=True), nullable=True)
    withdrawn_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class PeerRelayMessage(Base):
    __tablename__ = "peer_relay_messages"

    message_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(UUID(as_uuid=True), ForeignKey("peer_connect_requests.request_id", ondelete="CASCADE"), nullable=False, index=True)
    sender_role = Column(String(32), nullable=False)
    sender_id = Column(UUID(as_uuid=True), nullable=False)
    body_encrypted = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    retention_expires_at = Column(DateTime(timezone=True), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class PeerBlock(Base):
    __tablename__ = "peer_blocks"
    __table_args__ = (UniqueConstraint("supporter_id", "requester_id", name="uq_peer_block_pair"),)

    block_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supporter_id = Column(UUID(as_uuid=True), ForeignKey("peer_signups.supporter_id", ondelete="CASCADE"), nullable=False, index=True)
    requester_id = Column(UUID(as_uuid=True), ForeignKey("peer_requesters.requester_id", ondelete="CASCADE"), nullable=False, index=True)
    created_by_role = Column(String(32), nullable=False)
    created_by_id = Column(UUID(as_uuid=True), nullable=False)
    reason_code = Column(String(40), nullable=False, default="participant_safety_choice")
    active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    retention_expires_at = Column(DateTime(timezone=True), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class PeerConnectionReport(Base):
    __tablename__ = "peer_connection_reports"

    connection_report_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(UUID(as_uuid=True), ForeignKey("peer_connect_requests.request_id", ondelete="CASCADE"), nullable=False, index=True)
    reporter_role = Column(String(32), nullable=False)
    reporter_id = Column(UUID(as_uuid=True), nullable=False)
    target_role = Column(String(32), nullable=False)
    target_id = Column(UUID(as_uuid=True), nullable=False)
    reason_encrypted = Column(Text, nullable=False)
    status = Column(String(32), nullable=False, default="submitted")
    severity = Column(String(16), nullable=True)
    assigned_to_role = Column(String(32), nullable=True)
    assigned_to_id = Column(String(64), nullable=True)
    triaged_at = Column(DateTime(timezone=True), nullable=True)
    triaged_by = Column(String(64), nullable=True)
    resolution_code = Column(String(48), nullable=True)
    resolution_encrypted = Column(Text, nullable=True)
    resolved_by = Column(String(64), nullable=True)
    duplicate_of = Column(UUID(as_uuid=True), nullable=True)
    reported_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    retention_expires_at = Column(DateTime(timezone=True), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class PeerModerationNote(Base):
    __tablename__ = "peer_moderation_notes"

    note_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    connection_report_id = Column(UUID(as_uuid=True), ForeignKey("peer_connection_reports.connection_report_id", ondelete="CASCADE"), nullable=False, index=True)
    author_role = Column(String(32), nullable=False)
    author_id = Column(String(64), nullable=False)
    note_encrypted = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    retention_expires_at = Column(DateTime(timezone=True), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class PeerNotification(Base):
    __tablename__ = "peer_notifications"

    notification_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type = Column(String(64), nullable=False)
    target_type = Column(String(40), nullable=False)
    target_id = Column(String(64), nullable=False, index=True)
    recipient_role = Column(String(32), nullable=False)
    recipient_id = Column(String(64), nullable=False)
    channel = Column(String(20), nullable=False, default="email")
    status = Column(String(32), nullable=False, default="pending")
    attempt_count = Column(Integer, nullable=False, default=0)
    provider_message_id = Column(String(128), nullable=True)
    last_error_code = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    attempted_at = Column(DateTime(timezone=True), nullable=True)
    retention_expires_at = Column(DateTime(timezone=True), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

class ResourceClick(Base):
    __tablename__ = "resource_clicks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    resource_id = Column(String(100), nullable=False)
    action = Column(String(20), nullable=False)
    clicked_at = Column(DateTime(timezone=True), server_default=func.now())


class SupporterReport(Base):
    __tablename__ = "supporter_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(UUID(as_uuid=True), nullable=False, unique=True, default=uuid.uuid4)
    supporter_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    reporter_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    supporter_name = Column(String(200), nullable=True)  # Legacy name reference.
    reporter_email = Column(String(200))
    reason = Column(Text, nullable=True)  # Legacy PII migration source.
    private_data_encrypted = Column(Text, nullable=True)
    reported_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved = Column(Boolean, default=False)
    status = Column(String(32), nullable=False, default="open")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    retention_expires_at = Column(DateTime(timezone=True), nullable=True)
    withdrawn_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class PeerAuditLog(Base):
    __tablename__ = "peer_audit_logs"

    audit_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_role = Column(String(32), nullable=False)
    actor_id = Column(String(64), nullable=False)
    action = Column(String(80), nullable=False)
    target_type = Column(String(40), nullable=False)
    target_id = Column(String(64), nullable=False)
    event_metadata = Column(JSONB, nullable=False, default=dict)
    occurred_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    retention_expires_at = Column(DateTime(timezone=True), nullable=False)


class PeerStatusHistory(Base):
    __tablename__ = "peer_status_history"

    history_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String(40), nullable=False)
    entity_id = Column(String(64), nullable=False, index=True)
    previous_status = Column(String(32), nullable=True)
    new_status = Column(String(32), nullable=False)
    actor_role = Column(String(32), nullable=False)
    actor_id = Column(String(64), nullable=False)
    changed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    retention_expires_at = Column(DateTime(timezone=True), nullable=False)


class RateLimitBucket(Base):
    __tablename__ = "rate_limit_buckets"
    __table_args__ = (UniqueConstraint("scope", "subject_hash", name="uq_rate_limit_scope_subject"),)

    bucket_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scope = Column(String(80), nullable=False)
    subject_hash = Column(String(64), nullable=False)
    window_started_at = Column(DateTime(timezone=True), nullable=False)
    count = Column(Integer, nullable=False, default=0)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
