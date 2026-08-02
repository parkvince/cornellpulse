-- Additive moderation, notification, and bidirectional-blocking controls.
-- Apply after 20260803_connection_relay.sql while Peer Connect remains off.
BEGIN;

ALTER TABLE peer_requesters
    ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

ALTER TABLE peer_blocks
    ADD COLUMN IF NOT EXISTS reason_code VARCHAR(40) NOT NULL DEFAULT 'participant_safety_choice',
    ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

ALTER TABLE peer_connection_reports
    ADD COLUMN IF NOT EXISTS severity VARCHAR(16),
    ADD COLUMN IF NOT EXISTS assigned_to_role VARCHAR(32),
    ADD COLUMN IF NOT EXISTS assigned_to_id VARCHAR(64),
    ADD COLUMN IF NOT EXISTS triaged_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS triaged_by VARCHAR(64),
    ADD COLUMN IF NOT EXISTS resolution_code VARCHAR(48),
    ADD COLUMN IF NOT EXISTS resolution_encrypted TEXT,
    ADD COLUMN IF NOT EXISTS resolved_by VARCHAR(64),
    ADD COLUMN IF NOT EXISTS duplicate_of UUID;

UPDATE peer_connection_reports SET status = 'submitted' WHERE status = 'open';

CREATE UNIQUE INDEX IF NOT EXISTS uq_peer_active_report_submission
    ON peer_connection_reports (request_id, reporter_role, reporter_id)
    WHERE status IN ('submitted', 'triaged', 'investigating') AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS peer_moderation_notes (
    note_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_report_id UUID NOT NULL REFERENCES peer_connection_reports(connection_report_id) ON DELETE CASCADE,
    author_role VARCHAR(32) NOT NULL,
    author_id VARCHAR(64) NOT NULL,
    note_encrypted TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    retention_expires_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_peer_moderation_notes_report ON peer_moderation_notes (connection_report_id);
CREATE INDEX IF NOT EXISTS ix_peer_moderation_notes_retention ON peer_moderation_notes (retention_expires_at);

CREATE TABLE IF NOT EXISTS peer_notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(64) NOT NULL,
    target_type VARCHAR(40) NOT NULL,
    target_id VARCHAR(64) NOT NULL,
    recipient_role VARCHAR(32) NOT NULL,
    recipient_id VARCHAR(64) NOT NULL,
    channel VARCHAR(20) NOT NULL DEFAULT 'email',
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    attempt_count INTEGER NOT NULL DEFAULT 0,
    provider_message_id VARCHAR(128),
    last_error_code VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    attempted_at TIMESTAMPTZ,
    retention_expires_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_peer_notifications_target ON peer_notifications (target_id);
CREATE INDEX IF NOT EXISTS ix_peer_notifications_retention ON peer_notifications (retention_expires_at);

COMMIT;
