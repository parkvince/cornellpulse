-- Reliability migration. Apply with a database backup and a transaction-capable client.
-- It preserves aggregate totals while collapsing any pre-existing duplicate hourly rows.
BEGIN;

WITH grouped AS (
    SELECT college, hour_bucket, MIN(id) AS keep_id,
           SUM(check_in_count) AS check_in_count,
           SUM(mood_sum) AS mood_sum,
           SUM(sleep_score_sum) AS sleep_score_sum,
           SUM(workload_score_sum) AS workload_score_sum,
           SUM(distress_level_high) AS distress_level_high,
           SUM(distress_level_mod) AS distress_level_mod,
           SUM(distress_level_low) AS distress_level_low
    FROM college_hour_aggregates
    GROUP BY college, hour_bucket
), updated AS (
    UPDATE college_hour_aggregates target
    SET check_in_count = grouped.check_in_count,
        mood_sum = grouped.mood_sum,
        sleep_score_sum = grouped.sleep_score_sum,
        workload_score_sum = grouped.workload_score_sum,
        distress_level_high = grouped.distress_level_high,
        distress_level_mod = grouped.distress_level_mod,
        distress_level_low = grouped.distress_level_low
    FROM grouped
    WHERE target.id = grouped.keep_id
    RETURNING target.id
)
DELETE FROM college_hour_aggregates target
USING grouped
WHERE target.college = grouped.college
  AND target.hour_bucket = grouped.hour_bucket
  AND target.id <> grouped.keep_id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_college_hour_aggregate_bucket
    ON college_hour_aggregates (college, hour_bucket);

CREATE TABLE IF NOT EXISTS aggregate_contribution_receipts (
    receipt_id UUID PRIMARY KEY,
    contribution_hash VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_aggregate_contribution_receipts_expires_at
    ON aggregate_contribution_receipts (expires_at);

COMMIT;
