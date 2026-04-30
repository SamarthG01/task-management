from typing import Annotated, List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import EmailStr
from uuid import UUID

from app.db.session import get_db
from app.authentication.deps import get_current_user
from app.models.user import User
from app.models.project import Project, ProjectMember, RoleEnum
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectMemberResponse, ProjectMemberCreate

router = APIRouter()

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: ProjectCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Create a new project. The user who creates it automatically becomes an Admin.
    """
    # 1. Prepare the Project
    new_project = Project(
        name=project_in.name,
        description=project_in.description,
        created_by=current_user.id
    )
    session.add(new_project)
    
    # Flush to generate the new_project.id without permanently committing yet
    await session.flush() 
    
    # 2. Prepare the Admin Membership
    new_member = ProjectMember(
        user_id=current_user.id,
        project_id=new_project.id,
        role=RoleEnum.admin
    )
    session.add(new_member)
    
    # 3. Commit both to the database safely
    await session.commit()
    await session.refresh(new_project)
    
    return new_project

@router.get("/", response_model=List[ProjectResponse])
async def get_my_projects(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Retrieve all projects where the current logged-in user is a member.
    """
    query = (
        select(Project)
        .join(ProjectMember, Project.id == ProjectMember.project_id)
        .where(ProjectMember.user_id == current_user.id)
    )
    result = await session.execute(query)
    projects = result.scalars().all()
    
    return projects

@router.post("/{project_id}/members", response_model=ProjectMemberResponse)
async def add_project_member(
    project_id: UUID,
    member_in: ProjectMemberCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Add a user to a project. Only Project Admins can perform this action.
    """
    # 1. SECURITY CHECK: Is the current_user an Admin of this project?
    admin_check = await session.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
            ProjectMember.role == RoleEnum.admin
        )
    )
    if not admin_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not authorized. Only project admins can add members."
        )

    # 2. VALIDATION CHECK: Does the user they want to add actually exist?
    user_search = await session.execute(select(User).where(User.email == member_in.email))
    target_user = user_search.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User with this email not found in the system.")

    # 3. DUPLICATE CHECK: Are they already in the project?
    duplicate_check = await session.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == target_user.id
        )
    )
    if duplicate_check.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User is already a member of this project.")

    # 4. EXECUTE: Add the new member
    new_member = ProjectMember(
        user_id=target_user.id,
        project_id=project_id,
        role=member_in.role
    )
    
    session.add(new_member)
    await session.commit()
    await session.refresh(new_member)
    
    return new_member