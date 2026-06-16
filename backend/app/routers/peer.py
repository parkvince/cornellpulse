from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.db_models import PeerSignup, PeerConnectRequest
import os
import resend

router = APIRouter()

resend.api_key = os.environ.get("RESEND_API_KEY", "")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "cornellpulse@gmail.com")

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

@router.post("/peer-signup")
async def peer_signup(request: PeerSignupRequest, db: AsyncSession = Depends(get_db)):
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

    if resend.api_key:
        try:
            resend.Emails.send({
                "from": "CornellPulse <onboarding@resend.dev>",
                "to": ADMIN_EMAIL,
                "subject": f"New supporter application from {request.name}",
                "html": f"""
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
                <p>Log in to the admin dashboard to review and approve this application.</p>
                """
            })
        except Exception:
            pass

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

    if resend.api_key:
        try:
            resend.Emails.send({
                "from": "CornellPulse <onboarding@resend.dev>",
                "to": signup.email,
                "subject": "You have been approved as a CornellPulse peer supporter",
                "html": f"""
                <h2>You are approved!</h2>
                <p>Hi {signup.name},</p>
                <p>We have reviewed your application and approved you as a peer supporter on CornellPulse. Cornell students can now find your profile and request to meet up with you.</p>
                <p>When a student requests to connect with you, we will reach out to both of you over email to make the introduction.</p>
                <p>Thank you for being willing to show up for other students. It means a lot.</p>
                <br/>
                <p>The CornellPulse Team</p>
                """
            })
        except Exception:
            pass

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
async def peer_connect(request: PeerConnectRequestModel, db: AsyncSession = Depends(get_db)):
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

    if resend.api_key:
        try:
            resend.Emails.send({
                "from": "CornellPulse <onboarding@resend.dev>",
                "to": ADMIN_EMAIL,
                "subject": f"New peer connect request from {request.requester_name}",
                "html": f"""
                <h2>New peer connect request</h2>
                <p><strong>From:</strong> {request.requester_name} ({request.requester_email})</p>
                <p><strong>Wants to meet:</strong> {request.supporter_name}</p>
                <p><strong>Preferred location:</strong> {request.preferred_location}</p>
                <p><strong>Preferred time:</strong> {request.preferred_time}</p>
                <p><strong>Phone:</strong> {request.requester_phone or 'Not provided'}</p>
                <p><strong>Message:</strong> {request.message or 'Not provided'}</p>
                <br/>
                <p>Reply to this email or log into the admin dashboard to follow up within 24 hours.</p>
                """
            })
        except Exception:
            pass

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