"""Read-only staging/production readiness and schema verifier.

The command never prints database URLs, tokens, cookies, or response bodies.
It intentionally fails closed when the target or required evidence is absent.
"""

from __future__ import annotations

import argparse
import asyncio
import csv
import json
import os
import ssl
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


FORBIDDEN_TABLES = {"college_hour_aggregates", "campus_hour_aggregates"}
FORBIDDEN_AGGREGATE_COLUMNS = {"mood", "sleep", "workload", "college", "hour", "free_text", "text"}
REQUIRED_AGGREGATE_COLUMNS = {"day_bucket", "completion_count", "created_at", "updated_at"}


def fetch_readiness(base_url: str) -> dict[str, object]:
    request = Request(f"{base_url.rstrip('/')}/api/v1/health/ready", headers={"Accept": "application/json"})
    try:
        with urlopen(request, timeout=8, context=ssl.create_default_context()) as response:
            if response.status != 200:
                raise RuntimeError(f"readiness returned HTTP {response.status}")
            payload = json.load(response)
    except HTTPError as exc:
        raise RuntimeError(f"readiness returned HTTP {exc.code}") from None
    except (URLError, TimeoutError, ValueError) as exc:
        raise RuntimeError(f"readiness unavailable: {type(exc).__name__}") from None
    if not isinstance(payload, dict) or payload.get("status") != "ready" or not isinstance(payload.get("components"), dict):
        raise RuntimeError("readiness response shape/status is not ready")
    return payload


async def verify_schema(database_url: str) -> None:
    engine = create_async_engine(database_url, echo=False, pool_pre_ping=True)
    try:
        async with engine.connect() as connection:
            table_rows = await connection.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
            tables = {row[0] for row in table_rows}
            old = tables & FORBIDDEN_TABLES
            if old:
                raise RuntimeError("legacy sensitive aggregate table remains")
            if "campus_daily_aggregates" not in tables:
                raise RuntimeError("campus_daily_aggregates is missing")
            column_rows = await connection.execute(text("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='campus_daily_aggregates'"))
            columns = {row[0] for row in column_rows}
            if not REQUIRED_AGGREGATE_COLUMNS.issubset(columns):
                raise RuntimeError("campus_daily_aggregates is missing required minimized columns")
            if columns & FORBIDDEN_AGGREGATE_COLUMNS:
                raise RuntimeError("campus_daily_aggregates contains a forbidden sensitive column")
    finally:
        await engine.dispose()


def verify_evidence(path: Path, environment: str) -> None:
    if not path.is_file():
        raise RuntimeError("release evidence matrix is missing")
    with path.open(newline="", encoding="utf-8-sig") as handle:
        rows = [row for row in csv.DictReader(handle) if row.get("Environment") == environment]
    if not rows:
        raise RuntimeError(f"no {environment} evidence rows exist")
    if any(row.get("Status") != "PASS" or not row.get("TimestampUTC") or not row.get("Artifact") for row in rows):
        raise RuntimeError(f"{environment} evidence contains a non-PASS or unsupported PASS row")


async def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--environment", choices=("staging", "production"), required=True)
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--evidence", type=Path)
    args = parser.parse_args()
    if not args.base_url.startswith("https://"):
        raise RuntimeError("target base URL must use HTTPS")
    database_url = os.environ.get("DATABASE_URL", "")
    if not database_url:
        raise RuntimeError("DATABASE_URL must be injected by the approved secret-management process")
    fetch_readiness(args.base_url)
    await verify_schema(database_url)
    if args.evidence:
        verify_evidence(args.evidence, args.environment)
    print(f"{args.environment} readiness and minimized aggregate schema verified; no secret values printed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(asyncio.run(main()))
    except RuntimeError as exc:
        print(f"BLOCKED: {exc}", file=sys.stderr)
        raise SystemExit(2)
