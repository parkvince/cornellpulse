-- Privacy migration: remove sensitive college/hour wellness aggregates.
-- Back up first. Only non-sensitive campus-wide daily completion counts of five
-- or more are carried forward; mood, sleep, workload, college, and hour data are deleted.
BEGIN;

CREATE TABLE IF NOT EXISTS campus_daily_aggregates (
    id SERIAL PRIMARY KEY,
    day_bucket DATE NOT NULL UNIQUE,
    check_in_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF to_regclass('public.campus_hour_aggregates') IS NOT NULL THEN
        INSERT INTO campus_daily_aggregates (day_bucket, check_in_count)
        SELECT DATE(hour_bucket AT TIME ZONE 'UTC'), SUM(check_in_count)
        FROM campus_hour_aggregates
        GROUP BY DATE(hour_bucket AT TIME ZONE 'UTC')
        HAVING SUM(check_in_count) >= 5
        ON CONFLICT (day_bucket) DO UPDATE
        SET check_in_count = EXCLUDED.check_in_count,
            updated_at = NOW();
    END IF;
END $$;

DROP TABLE IF EXISTS college_hour_aggregates;
DROP TABLE IF EXISTS campus_hour_aggregates;

CREATE INDEX IF NOT EXISTS ix_resource_clicks_clicked_at ON resource_clicks (clicked_at);

COMMIT;
