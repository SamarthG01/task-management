from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.project import RoleEnum
from pydantic import EmailStr

# Shared properties
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

# Properties to receive on project creation
class ProjectCreate(ProjectBase):
    pass

# Properties to return to client
class ProjectResponse(ProjectBase):
    id: UUID
    created_by: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ProjectMemberResponse(BaseModel):
    user_id: UUID
    project_id: UUID
    role: RoleEnum
    
    model_config = ConfigDict(from_attributes=True)

class ProjectMemberCreate(BaseModel):
    email: EmailStr
    role: RoleEnum = RoleEnum.member