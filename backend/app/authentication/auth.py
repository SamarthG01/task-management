from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token

router = APIRouter()

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    user_in: UserCreate, 
    session: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Register a new user.
    """
    # Check if user already exists
    result = await session.execute(select(User).where(User.email == user_in.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    # Create new user
    new_user = User(
        email=user_in.email,
        name=user_in.name,
        password_hash=get_password_hash(user_in.password),
    )
    
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)
    
    return new_user

@router.post("/login", response_model=Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    # Retrieve user
    result = await session.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    # Authenticate
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Generate Token
    access_token = create_access_token(subject=user.id)
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }