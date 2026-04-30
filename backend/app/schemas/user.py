from pydantic import BaseModel, EmailStr, ConfigDict, Field
from uuid import UUID
from datetime import datetime

# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    name: str

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=72)

# Properties to return to client
class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Schema for the JWT Token Response
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: str | None = None