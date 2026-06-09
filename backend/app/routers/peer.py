from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter()

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

class PeerConnectRequest(BaseModel):
    supporter_name: str
    requester_name: str
    requester_email: str
    requester_phone: str
    preferred_location: str
    preferred_time: str
    message: Optional[str] = None

signups: List[dict] = []
connect_requests: List[dict] = []

APPROVED_SUPPORTERS: List[dict] = []

@router.post("/peer-signup")
async def peer_signup(request: PeerSignupRequest):
    entry = request.dict()
    entry["submitted_at"] = datetime.now().isoformat()
    entry["approved"] = False
    signups.append(entry)
    return {"status": "received"}

@router.get("/peer-signups")
async def get_signups():
    return signups

@router.post("/peer-signups/{index}/approve")
async def approve_signup(index: int):
    if index < 0 or index >= len(signups):
        return {"error": "Not found"}
    signups[index]["approved"] = True
    supporter = {
        "name": signups[index]["name"],
        "year": signups[index]["year"],
        "major": signups[index].get("major", ""),
        "locations": signups[index]["locations"],
        "availability": signups[index].get("availability", []),
        "interests": signups[index].get("interests", []),
        "about": signups[index].get("about", ""),
        "email": signups[index]["email"],
        "phone": signups[index]["phone"],
    }
    APPROVED_SUPPORTERS.append(supporter)
    return {"status": "approved"}

@router.get("/peer-supporters")
async def get_supporters():
    return APPROVED_SUPPORTERS

@router.post("/peer-connect")
async def peer_connect(request: PeerConnectRequest):
    entry = request.dict()
    entry["requested_at"] = datetime.now().isoformat()
    entry["status"] = "pending"
    connect_requests.append(entry)
    return {"status": "received"}

@router.get("/peer-requests")
async def get_requests():
    return connect_requests