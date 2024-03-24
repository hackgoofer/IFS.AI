from typing import List
from pydantic import BaseModel

from enum import Enum

class PartName(Enum):
    FIREFIGHTER = "Firefighter"
    MANAGER = "Manager"
    EXILE = "Exile"

class IFSPart(BaseModel):
    name: PartName
    personality: str # this is their system prompt, perhaps you can combine this with unmet needs as well
    unmet_needs: List[str]

class IFSParts(BaseModel):
    parts: List[IFSPart]