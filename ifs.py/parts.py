from typing import List
from pydantic import BaseModel, Field
import json

from enum import Enum

class PartName(Enum):
    FIREFIGHTER = "Firefighter"
    MANAGER = "Manager"
    EXILE = "Exile"

class IFSPart(BaseModel):
    name: PartName = Field(default="Jane", description="The name of the part, give a geneder appropriate name.")
    preferred_name: str = Field(default=None, description="The user's name.")

    personality: str # this is their system prompt, perhaps you can combine this with unmet needs as well
    interests: List[str] = Field(
        default_factory=list,
        description="Short (two to three word) descriptions of areas of particular interest for the part. This can be a concept, activity, or idea. Favor broad interests over specific ones.",
    )
    unmet_needs: List[str] = Field("The unmet needs of the part.", description="The unmet needs of the part.")
    other_info: List[str] = Field(
        default_factory=list,
        description="",
    )

class IFSParts(BaseModel):
    parts: List[IFSPart]

class UserProfile(BaseModel):
    preferred_name: str = Field(default=None, description="The user's name.")

    summary: str = Field(
        default="",
        description="A quick summary of how the user would describe themselves.",
    )
    interests: List[str] = Field(
        default_factory=list,
        description="Short (two to three word) descriptions of areas of particular interest for the user. This can be a concept, activity, or idea. Favor broad interests over specific ones.",
    )
    relationships: List[IFSPart] = Field(
        default_factory=IFSPart,
        description="A list of friends, family members, colleagues, and other relationships.",
    )
    other_info: List[str] = Field(
        default_factory=list,
        description="",
    )