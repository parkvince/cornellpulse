from pydantic import BaseModel, ConfigDict
from enum import Enum

class CollegeEnum(str, Enum):
    engineering = "engineering"
    arts_sciences = "arts_sciences"
    dyson = "dyson"
    ilr = "ilr"
    cals = "cals"
    aap = "aap"
    vet = "vet"
    human_ecology = "human_ecology"
    hotel = "hotel"
    bowers = "bowers"
    public_policy = "public_policy"
    law = "law"
    tech = "tech"
    weill = "weill"
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

class AggregateContributionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    mood_score: int
    sleep_category: SleepCategory
    workload_category: WorkloadCategory
    college: CollegeEnum

class AggregateContributionResponse(BaseModel):
    aggregate_updated: bool
