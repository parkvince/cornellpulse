from pydantic import BaseModel
from typing import Optional
from enum import Enum

class CollegeEnum(str, Enum):
    engineering = "engineering"
    arts_sciences = "arts_sciences"
    dyson = "dyson"
    ilr = "ilr"
    cals = "cals"
    aap = "aap"
    vet = "vet"
    graduate = "graduate"
    professional = "professional"
    other = "other"

class SleepCategory(str, Enum):
    under_4 = "under_4"
    four_to_six = "4_to_6"
    six_to_eight = "6_to_8"
    over_8 = "over_8"

class WorkloadCategory(str, Enum):
    light = "light"
    moderate = "moderate"
    heavy = "heavy"
    unbearable = "unbearable"

class CheckInRequest(BaseModel):
    mood_score: int
    sleep_category: SleepCategory
    workload_category: WorkloadCategory
    free_text: Optional[str] = None
    college: CollegeEnum
    session_token: str

class ResourceResult(BaseModel):
    resource_id: str
    name: str
    tagline: str
    phone: Optional[str] = None
    url: Optional[str] = None
    hours: Optional[str] = None
    how_to_access: Optional[str] = None

class TriageResult(BaseModel):
    primary: ResourceResult
    secondary: list[ResourceResult]
    crisis_flag: bool
    distress_level: str

class CheckInResponse(BaseModel):
    triage_result: TriageResult
    aggregate_updated: bool