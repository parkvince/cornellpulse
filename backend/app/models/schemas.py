from pydantic import BaseModel, ConfigDict
from typing import Literal

class AggregateContributionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    event: Literal["checkin_completed"]
    consent_granted: Literal[True]

class AggregateContributionResponse(BaseModel):
    aggregate_updated: bool
