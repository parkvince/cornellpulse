"""Encrypt legacy Peer Connect PII after the additive schema migration.

Dry-run is the default. Use --apply only after a verified database backup and
after PEER_PII_ENCRYPTION_KEY is configured. The script never prints PII.
"""

import argparse
import asyncio

from sqlalchemy import or_, select

from app.database import AsyncSessionLocal
from app.models.db_models import PeerConnectRequest, PeerSignup, SupporterReport
from app.services.peer_security import encrypt_private_data


async def backfill(apply: bool) -> dict[str, int]:
    counts = {"supporters": 0, "requests": 0, "reports": 0}
    async with AsyncSessionLocal() as db:
        supporters = (await db.execute(select(PeerSignup).where(
            PeerSignup.private_data_encrypted.is_(None),
            or_(PeerSignup.email.is_not(None), PeerSignup.phone.is_not(None), PeerSignup.ref_email.is_not(None)),
        ))).scalars().all()
        for supporter in supporters:
            encrypted = encrypt_private_data({
                "email": supporter.email,
                "phone": supporter.phone,
                "reference_name": supporter.ref_name,
                "reference_phone": supporter.ref_phone,
                "reference_email": supporter.ref_email,
                "reference_relationship": supporter.ref_relationship,
            })
            if apply:
                supporter.private_data_encrypted = encrypted
                supporter.email = supporter.phone = supporter.ref_name = supporter.ref_phone = supporter.ref_email = supporter.ref_relationship = None
            counts["supporters"] += 1

        requests = (await db.execute(select(PeerConnectRequest).where(
            PeerConnectRequest.private_data_encrypted.is_(None),
            or_(PeerConnectRequest.requester_email.is_not(None), PeerConnectRequest.message.is_not(None)),
        ))).scalars().all()
        for request in requests:
            encrypted = encrypt_private_data({
                "requester_name": request.requester_name,
                "requester_email": request.requester_email,
                "requester_phone": request.requester_phone,
                "preferred_location": request.preferred_location,
                "preferred_time": request.preferred_time,
                "message": request.message,
            })
            if apply:
                request.private_data_encrypted = encrypted
                request.requester_name = request.requester_email = request.requester_phone = request.preferred_location = request.preferred_time = request.message = None
            counts["requests"] += 1

        reports = (await db.execute(select(SupporterReport).where(
            SupporterReport.private_data_encrypted.is_(None),
            or_(SupporterReport.reporter_email.is_not(None), SupporterReport.reason.is_not(None)),
        ))).scalars().all()
        for report in reports:
            encrypted = encrypt_private_data({"reporter_email": report.reporter_email, "reason": report.reason})
            if apply:
                report.private_data_encrypted = encrypted
                report.reporter_email = report.reason = None
            counts["reports"] += 1

        if apply:
            await db.commit()
        else:
            await db.rollback()
    return counts


async def main() -> None:
    parser = argparse.ArgumentParser(description="Encrypt legacy Peer Connect PII without printing record contents.")
    parser.add_argument("--apply", action="store_true", help="Persist encrypted values and clear copied plaintext columns.")
    args = parser.parse_args()
    counts = await backfill(args.apply)
    mode = "applied" if args.apply else "dry-run"
    print(f"Peer PII backfill {mode}: {counts}")


if __name__ == "__main__":
    asyncio.run(main())
