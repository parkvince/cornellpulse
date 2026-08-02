-- Additive double-opt-in connection and encrypted relay migration.
-- Apply only after the peer-security and supporter-onboarding migrations while
-- Peer Connect remains disabled. No existing row or column is deleted.

BEGIN;

ALTER TABLE peer_requesters
    ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS identity_verification_method VARCHAR(40),
    ADD COLUMN IF NOT EXISTS identity_subject_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS identity_verified_by VARCHAR(64);

ALTER TABLE peer_connect_requests
    ADD COLUMN IF NOT EXISTS requester_consented_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS supporter_consented_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS unavailable_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_relay_at TIMESTAMPTZ;

-- Legacy requests did not record the explicit double consent required by the
-- new flow. Preserve the records but make active-looking legacy rows unavailable.
UPDATE peer_connect_requests
SET status = 'unavailable', unavailable_at = COALESCE(unavailable_at, now())
WHERE requester_consented_at IS NULL AND status IN ('pending', 'accepted');

CREATE UNIQUE INDEX IF NOT EXISTS uq_peer_active_connection_pair
    ON peer_connect_requests (supporter_id, requester_id)
    WHERE status IN ('pending', 'accepted') AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS peer_relay_messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES peer_connect_requests(request_id) ON DELETE CASCADE,
    sender_role VARCHAR(32) NOT NULL,
    sender_id UUID NOT NULL,
    body_encrypted TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    retention_expires_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_peer_relay_messages_request_id ON peer_relay_messages (request_id);
CREATE INDEX IF NOT EXISTS ix_peer_relay_messages_retention ON peer_relay_messages (retention_expires_at);

CREATE TABLE IF NOT EXISTS peer_blocks (
    block_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supporter_id UUID NOT NULL REFERENCES peer_signups(supporter_id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES peer_requesters(requester_id) ON DELETE CASCADE,
    created_by_role VARCHAR(32) NOT NULL,
    created_by_id UUID NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    retention_expires_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_peer_block_pair UNIQUE (supporter_id, requester_id)
);
CREATE INDEX IF NOT EXISTS ix_peer_blocks_supporter_id ON peer_blocks (supporter_id);
CREATE INDEX IF NOT EXISTS ix_peer_blocks_requester_id ON peer_blocks (requester_id);

CREATE TABLE IF NOT EXISTS peer_connection_reports (
    connection_report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES peer_connect_requests(request_id) ON DELETE CASCADE,
    reporter_role VARCHAR(32) NOT NULL,
    reporter_id UUID NOT NULL,
    target_role VARCHAR(32) NOT NULL,
    target_id UUID NOT NULL,
    reason_encrypted TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'open',
    reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    retention_expires_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_peer_connection_reports_request_id ON peer_connection_reports (request_id);
CREATE INDEX IF NOT EXISTS ix_peer_connection_reports_retention ON peer_connection_reports (retention_expires_at);

COMMIT;
