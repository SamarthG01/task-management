from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import ValidationError

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import TokenPayload

# This tells FastAPI where the login endpoint is for the Swagger UI
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login"
)

async def get_current_user(
    token: Annotated[str, Depends(reusable_oauth2)],
    session: Annotated[AsyncSession, Depends(get_db)]
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the JWT
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        
        if token_data.sub is None:
            raise credentials_exception
            
    except (JWTError, ValidationError):
        raise credentials_exception

    # Fetch user asynchronously
    result = await session.execute(select(User).where(User.id == token_data.sub))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
        
    return user