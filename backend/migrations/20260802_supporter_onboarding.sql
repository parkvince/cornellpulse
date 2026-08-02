-- Additive supporter-onboarding state and consent migration.
-- Apply only after the peer-security migration, with Peer Connect and supporter
-- signup disabled. This migration does not delete existing rows or columns.

BEGIN;

ALTER TABLE peer_signups
    ADD COLUMN IF NOT EXISTS policy_version VARCHAR(32),
    ADD COLUMN IF NOT EXISTS policy_accepted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS identity_verification_method VARCHAR(40),
    ADD COLUMN IF NOT EXISTS identity_subject_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS identity_verified_by VARCHAR(64),
    ADD COLUMN IF NOT EXISTS training_requirements_version VARCHAR(32),
    ADD COLUMN IF NOT EXISTS training_modules_completed JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS training_completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS training_evidence_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS training_verified_by VARCHAR(64),
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

-- Legacy pending applications must pass every new gate. Existing approvals are
-- preserved but require human re-review before the feature can be enabled.
UPDATE peer_signups
SET status = CASE
    WHEN approved THEN 'approved'
    WHEN status = 'pending' THEN 'submitted'
    ELSE status
END;

CREATE TABLE IF NOT EXISTS supporter_reference_invitations (
    invitation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supporter_id UUID NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    invitee_email_encrypted TEXT NOT NULL,
    response_encrypted TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    consented_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_supporter_reference_invitations_supporter_id
    ON supporter_reference_invitations (supporter_id);
CREATE INDEX IF NOT EXISTS ix_supporter_reference_invitations_expires_at
    ON supporter_reference_invitations (expires_at);

COMMIT;
