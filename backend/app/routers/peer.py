from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.db_models import PeerSignup, PeerConnectRequest
from collections import defaultdict
from datetime import datetime, timedelta
import resend
from app.config import settings

router = APIRouter()

ADMIN_EMAIL = settings.ADMIN_EMAIL
FROM_EMAIL = "CornellPulse <onboarding@resend.dev>"

submission_log = defaultdict(list)

def check_rate_limit(ip: str, max_per_hour: int = 5):
    now = datetime.now()
    cutoff = now - timedelta(hours=1)
    submission_log[ip] = [t for t in submission_log[ip] if t > cutoff]
    if len(submission_log[ip]) >= max_per_hour:
        raise HTTPException(status_code=429, detail="Too many submissions. Please try again later.")
    submission_log[ip].append(now)

def send_email(to: str, subject: str, html: str):
    api_key = settings.RESEND_API_KEY
    if not api_key:
        print("No API key, skipping email")
        return
    try:
        resend.api_key = api_key
        result = resend.Emails.send({
            "from": FROM_EMAIL,
            "to": to,
            "subject": subject,
            "html": html,
        })
        print(f"Email sent: {result}")
    except Exception as e:
        print(f"Email failed: {e}")


class PeerSignupRequest(BaseModel):
    name: str
    email: str
    phone: str
    year: str
    major: Optional[str] = None
    locations: List[str]
    availability: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    about: Optional[str] = None
    refName: str
    refPhone: str
    refEmail: str
    refRelationship: Optional[str] = None

class PeerConnectRequestModel(BaseModel):
    supporter_name: str
    requester_name: str
    requester_email: str
    requester_phone: Optional[str] = None
    preferred_location: str
    preferred_time: str
    message: Optional[str] = None

class ReportRequest(BaseModel):
    supporter_name: str
    reporter_email: Optional[str] = None
    reason: str


@router.post("/peer-signup")
async def peer_signup(request: PeerSignupRequest, req: Request, db: AsyncSession = Depends(get_db)):
    check_rate_limit(req.client.host, max_per_hour=3)

    signup = PeerSignup(
        name=request.name,
        email=request.email,
        phone=request.phone,
        year=request.year,
        major=request.major,
        locations=request.locations,
        availability=request.availability or [],
        interests=request.interests or [],
        about=request.about,
        ref_name=request.refName,
        ref_phone=request.refPhone,
        ref_email=request.refEmail,
        ref_relationship=request.refRelationship,
        approved=False,
    )
    db.add(signup)
    await db.commit()

    send_email(
        to=ADMIN_EMAIL,
        subject=f"New supporter application from {request.name}",
        html=f"""
        <h2>New peer supporter application</h2>
        <p><strong>Name:</strong> {request.name}</p>
        <p><strong>Email:</strong> {request.email}</p>
        <p><strong>Phone:</strong> {request.phone}</p>
        <p><strong>Year:</strong> {request.year}</p>
        <p><strong>Major:</strong> {request.major or 'Not provided'}</p>
        <p><strong>About:</strong> {request.about or 'Not provided'}</p>
        <p><strong>Locations:</strong> {', '.join(request.locations)}</p>
        <br/>
        <h3>Reference</h3>
        <p><strong>Name:</strong> {request.refName}</p>
        <p><strong>Phone:</strong> {request.refPhone}</p>
        <p><strong>Email:</strong> {request.refEmail}</p>
        <p><strong>Relationship:</strong> {request.refRelationship or 'Not provided'}</p>
        <br/>
        <p>Log into the admin dashboard to review and approve.</p>
        """
    )

    return {"status": "received"}


@router.get("/peer-signups")
async def get_signups(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerSignup).order_by(PeerSignup.submitted_at.desc()))
    signups = result.scalars().all()
    return [
        {
            "index": i,
            "id": s.id,
            "name": s.name,
            "email": s.email,
            "phone": s.phone,
            "year": s.year,
            "major": s.major,
            "locations": s.locations,
            "availability": s.availability,
            "interests": s.interests,
            "about": s.about,
            "refName": s.ref_name,
            "refPhone": s.ref_phone,
            "refEmail": s.ref_email,
            "refRelationship": s.ref_relationship,
            "approved": s.approved,
            "submitted_at": s.submitted_at.isoformat() if s.submitted_at else None,
        }
        for i, s in enumerate(signups)
    ]


@router.post("/peer-signups/{signup_id}/approve")
async def approve_signup(signup_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerSignup).where(PeerSignup.id == signup_id))
    signup = result.scalar_one_or_none()
    if not signup:
        return {"error": "Not found"}
    signup.approved = True
    await db.commit()

    send_email(
        to=ADMIN_EMAIL,
        subject=f"ACTION NEEDED: Email approval to {signup.name} at {signup.email}",
        html=f"""
        <h2>Forward this approval to {signup.name} at {signup.email}</h2>
        <hr/>
        <h3>Message for {signup.name}</h3>
        <p>Hi {signup.name},</p>
        <p>We have reviewed your application and approved you as a peer supporter on CornellPulse. Cornell students can now find your profile and request to meet up with you.</p>
        <p>When a student requests to connect with you, we will reach out to let you know.</p>
        <p>Thank you for being willing to show up for other students.</p>
        <br/>
        <p>The CornellPulse Team</p>
        """
    )

    return {"status": "approved"}


@router.get("/peer-supporters")
async def get_supporters(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerSignup).where(PeerSignup.approved == True))
    supporters = result.scalars().all()
    return [
        {
            "name": s.name,
            "year": s.year,
            "major": s.major,
            "locations": s.locations,
            "availability": s.availability,
            "interests": s.interests,
            "about": s.about,
            "email": s.email,
            "phone": s.phone,
        }
        for s in supporters
    ]


@router.post("/peer-connect")
async def peer_connect(request: PeerConnectRequestModel, req: Request, db: AsyncSession = Depends(get_db)):
    check_rate_limit(req.client.host, max_per_hour=5)

    connect = PeerConnectRequest(
        supporter_name=request.supporter_name,
        requester_name=request.requester_name,
        requester_email=request.requester_email,
        requester_phone=request.requester_phone,
        preferred_location=request.preferred_location,
        preferred_time=request.preferred_time,
        message=request.message,
        status="pending",
    )
    db.add(connect)
    await db.commit()

    supporter_result = await db.execute(
        select(PeerSignup).where(PeerSignup.name == request.supporter_name, PeerSignup.approved == True)
    )
    supporter = supporter_result.scalars().first()

    if supporter:
        send_email(
            to=ADMIN_EMAIL,
            subject=f"ACTION NEEDED: Forward to {supporter.name} -- {request.requester_name} wants to connect",
            html=f"""
            <h2>Forward this to {supporter.name} at {supporter.email}</h2>
            <p>A student wants to connect with <strong>{supporter.name}</strong>. Please forward the details below to them.</p>
            <hr/>
            <h3>Message for {supporter.name}</h3>
            <p>Hi {supporter.name},</p>
            <p>A Cornell student saw your profile on CornellPulse and would like to meet up.</p>
            <p><strong>Their name:</strong> {request.requester_name}</p>
            <p><strong>Their email:</strong> {request.requester_email}</p>
            <p><strong>Their phone:</strong> {request.requester_phone or 'Not provided'}</p>
            <p><strong>Preferred location:</strong> {request.preferred_location}</p>
            <p><strong>Preferred time:</strong> {request.preferred_time}</p>
            <p><strong>Message:</strong> {request.message or 'Not provided'}</p>
            <br/>
            <p>They already have your contact info and may reach out directly.</p>
            """
        )

    send_email(
        to=ADMIN_EMAIL,
        subject=f"New peer connect: {request.requester_name} to {request.supporter_name}",
        html=f"""
        <h2>New peer connect request</h2>
        <p><strong>From:</strong> {request.requester_name} ({request.requester_email})</p>
        <p><strong>Wants to meet:</strong> {request.supporter_name}</p>
        <p><strong>Preferred location:</strong> {request.preferred_location}</p>
        <p><strong>Preferred time:</strong> {request.preferred_time}</p>
        <p><strong>Message:</strong> {request.message or 'Not provided'}</p>
        """
    )

    return {"status": "received"}


@router.get("/peer-requests")
async def get_requests(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerConnectRequest).order_by(PeerConnectRequest.requested_at.desc()))
    requests = result.scalars().all()
    return [
        {
            "id": r.id,
            "supporter_name": r.supporter_name,
            "requester_name": r.requester_name,
            "requester_email": r.requester_email,
            "requester_phone": r.requester_phone,
            "preferred_location": r.preferred_location,
            "preferred_time": r.preferred_time,
            "message": r.message,
            "status": r.status,
            "requested_at": r.requested_at.isoformat() if r.requested_at else None,
        }
        for r in requests
    ]


@router.delete("/peer-signups/{signup_id}")
async def delete_signup(signup_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerSignup).where(PeerSignup.id == signup_id))
    signup = result.scalar_one_or_none()
    if not signup:
        return {"error": "Not found"}
    await db.delete(signup)
    await db.commit()
    return {"status": "deleted"}


@router.post("/report-supporter")
async def report_supporter(request: ReportRequest, db: AsyncSession = Depends(get_db)):
    from app.models.db_models import SupporterReport
    report = SupporterReport(
        supporter_name=request.supporter_name,
        reporter_email=request.reporter_email,
        reason=request.reason,
    )
    db.add(report)
    await db.commit()

    send_email(
        to=ADMIN_EMAIL,
        subject=f"Report filed against {request.supporter_name}",
        html=f"""
        <h2>A student has filed a report</h2>
        <p><strong>Supporter:</strong> {request.supporter_name}</p>
        <p><strong>Reporter contact:</strong> {request.reporter_email or 'Not provided'}</p>
        <p><strong>Reason:</strong> {request.reason}</p>
        <br/>
        <p>Please review this as soon as possible.</p>
        """
    )

    return {"status": "received"}


@router.get("/reports")
async def get_reports(db: AsyncSession = Depends(get_db)):
    from app.models.db_models import SupporterReport
    result = await db.execute(select(SupporterReport).order_by(SupporterReport.reported_at.desc()))
    reports = result.scalars().all()
    return [
        {
            "id": r.id,
            "supporter_name": r.supporter_name,
            "reporter_email": r.reporter_email,
            "reason": r.reason,
            "reported_at": r.reported_at.isoformat() if r.reported_at else None,
            "resolved": r.resolved,
        }
        for r in reports
    ]

    @router.post("/peer-requests/{request_id}/resolve")
async def resolve_request(request_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerConnectRequest).where(PeerConnectRequest.id == request_id))
    req = result.scalar_one_or_none()
    if not req:
        return {"error": "Not found"}
    req.status = "resolved"
    await db.commit()
    return {"status": "resolved"}

@router.delete("/peer-requests/{request_id}")
async def delete_request(request_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerConnectRequest).where(PeerConnectRequest.id == request_id))
    req = result.scalar_one_or_none()
    if not req:
        return {"error": "Not found"}
    await db.delete(req)
    await db.commit()
    return {"status": "deleted"}