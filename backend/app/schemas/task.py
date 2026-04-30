from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.task import StatusEnum, PriorityEnum

# Shared properties
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: StatusEnum = StatusEnum.todo
    priority: PriorityEnum = PriorityEnum.medium
    due_date: Optional[datetime] = None

# Expected payload to create a task
class TaskCreate(TaskBase):
    project_id: UUID
    assigned_to: Optional[UUID] = None

# Expected payload for a Member updating a task (e.g., dragging it to "Done")
class TaskUpdate(BaseModel):
    status: Optional[StatusEnum] = None

# Data returned to the frontend
class TaskResponse(TaskBase):
    id: UUID
    project_id: UUID
    assigned_to: Optional[UUID]
    created_by: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)