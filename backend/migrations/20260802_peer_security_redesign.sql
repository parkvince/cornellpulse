-- Additive CornellPulse Peer Connect security migration.
-- Run against PostgreSQL in a reviewed maintenance window, then run the
-- encrypted PII backfill script before enabling either peer feature flag.
-- This migration preserves every existing table, column, and row.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE peer_signups
    ADD COLUMN IF NOT EXISTS supporter_id UUID,
    ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS credential_hash VARCHAR(60),
    ADD COLUMN IF NOT EXISTS private_data_encrypted TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE peer_signups
SET supporter_id = gen_random_uuid()
WHERE supporter_id IS NULL;

UPDATE peer_signups
SET status = CASE WHEN approved THEN 'approved' ELSE 'pending' END,
    retention_expires_at = COALESCE(retention_expires_at, submitted_at + INTERVAL '365 days')
WHERE status = 'pending' OR retention_expires_at IS NULL;

ALTER TABLE peer_signups ALTER COLUMN supporter_id SET NOT NULL;
ALTER TABLE peer_signups ALTER COLUMN email DROP NOT NULL;
ALTER TABLE peer_signups ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE peer_signups ALTER COLUMN ref_name DROP NOT NULL;
ALTER TABLE peer_signups ALTER COLUMN ref_phone DROP NOT NULL;
ALTER TABLE peer_signups ALTER COLUMN ref_email DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_peer_signups_supporter_id ON peer_signups (supporter_id);

CREATE TABLE IF NOT EXISTS peer_requesters (
    requester_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_hash VARCHAR(60),
    private_data_encrypted TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    retention_expires_at TIMESTAMPTZ NOT NULL,
    withdrawn_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

ALTER TABLE peer_connect_requests
    ADD COLUMN IF NOT EXISTS request_id UUID,
    ADD COLUMN IF NOT EXISTS supporter_id UUID,
    ADD COLUMN IF NOT EXISTS requester_id UUID,
    ADD COLUMN IF NOT EXISTS private_data_encrypted TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE peer_connect_requests SET request_id = gen_random_uuid() WHERE request_id IS NULL;
WITH unique_supporter_names AS (
    SELECT name, (array_agg(supporter_id))[1] AS supporter_id
    FROM peer_signups
    GROUP BY name
    HAVING COUNT(*) = 1
)
UPDATE peer_connect_requests request
SET supporter_id = supporter.supporter_id
FROM unique_supporter_names supporter
WHERE request.supporter_id IS NULL AND request.supporter_name = supporter.name;
UPDATE peer_connect_requests
SET retention_expires_at = COALESCE(retention_expires_at, requested_at + INTERVAL '90 days')
WHERE retention_expires_at IS NULL;
ALTER TABLE peer_connect_requests ALTER COLUMN request_id SET NOT NULL;
ALTER TABLE peer_connect_requests ALTER COLUMN supporter_name DROP NOT NULL;
ALTER TABLE peer_connect_requests ALTER COLUMN requester_name DROP NOT NULL;
ALTER TABLE peer_connect_requests ALTER COLUMN requester_email DROP NOT NULL;
ALTER TABLE peer_connect_requests ALTER COLUMN preferred_location DROP NOT NULL;
ALTER TABLE peer_connect_requests ALTER COLUMN preferred_time DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_peer_connect_requests_request_id ON peer_connect_requests (request_id);
CREATE INDEX IF NOT EXISTS ix_peer_connect_requests_supporter_id ON peer_connect_requests (supporter_id);
CREATE INDEX IF NOT EXISTS ix_peer_connect_requests_requester_id ON peer_connect_requests (requester_id);

ALTER TABLE supporter_reports
    ADD COLUMN IF NOT EXISTS report_id UUID,
    ADD COLUMN IF NOT EXISTS supporter_id UUID,
    ADD COLUMN IF NOT EXISTS reporter_id UUID,
    ADD COLUMN IF NOT EXISTS private_data_encrypted TEXT,
    ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'open',
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE supporter_reports SET report_id = gen_random_uuid() WHERE report_id IS NULL;
WITH unique_supporter_names AS (
    SELECT name, (array_agg(supporter_id))[1] AS supporter_id
    FROM peer_signups
    GROUP BY name
    HAVING COUNT(*) = 1
)
UPDATE supporter_reports report
SET supporter_id = supporter.supporter_id
FROM unique_supporter_names supporter
WHERE report.supporter_id IS NULL AND report.supporter_name = supporter.name;
UPDATE supporter_reports
SET status = CASE WHEN resolved THEN 'resolved' ELSE 'open' END,
    retention_expires_at = COALESCE(retention_expires_at, reported_at + INTERVAL '365 days')
WHERE status = 'open' OR retention_expires_at IS NULL;
ALTER TABLE supporter_reports ALTER COLUMN report_id SET NOT NULL;
ALTER TABLE supporter_reports ALTER COLUMN supporter_name DROP NOT NULL;
ALTER TABLE supporter_reports ALTER COLUMN reason DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_supporter_reports_report_id ON supporter_reports (report_id);
CREATE INDEX IF NOT EXISTS ix_supporter_reports_supporter_id ON supporter_reports (supporter_id);
CREATE INDEX IF NOT EXISTS ix_supporter_reports_reporter_id ON supporter_reports (reporter_id);

CREATE TABLE IF NOT EXISTS peer_audit_logs (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_role VARCHAR(32) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    action VARCHAR(80) NOT NULL,
    target_type VARCHAR(40) NOT NULL,
    target_id VARCHAR(64) NOT NULL,
    event_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    retention_expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS peer_status_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(40) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    previous_status VARCHAR(32),
    new_status VARCHAR(32) NOT NULL,
    actor_role VARCHAR(32) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    retention_expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_peer_status_history_entity_id ON peer_status_history (entity_id);

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
    bucket_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope VARCHAR(80) NOT NULL,
    subject_hash VARCHAR(64) NOT NULL,
    window_started_at TIMESTAMPTZ NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_rate_limit_scope_subject UNIQUE (scope, subject_hash)
);
CREATE INDEX IF NOT EXISTS ix_rate_limit_buckets_expires_at ON rate_limit_buckets (expires_at);

COMMIT;
