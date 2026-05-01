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
from app.models.task import Task
from app.schemas.task import TaskResponse
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


@router.get("/{project_id}/members", response_model=List[ProjectMemberResponse])
async def get_project_members(
    project_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Get all members of a specific project.
    """
    # 1. SECURITY CHECK: Make sure the person asking is actually in the project
    member_check = await session.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id
        )
    )
    if not member_check.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="You are not a member of this project.")

    # 2. FETCH MEMBERS
    result = await session.execute(
        select(ProjectMember).where(ProjectMember.project_id == project_id)
    )
    members = result.scalars().all()
    
    return members

@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_project_member(
    project_id: UUID,
    user_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Remove a user from a project. Only Project Admins can perform this action.
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
            detail="Not authorized. Only project admins can remove members."
        )

    # 2. VALIDATION CHECK: Is the target user actually in the project?
    member_to_remove_check = await session.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id
        )
    )
    member_to_remove = member_to_remove_check.scalar_one_or_none()
    
    if not member_to_remove:
        raise HTTPException(status_code=404, detail="User is not a member of this project.")

    # 3. PREVENT SELF-LOCKOUT: Don't let the last admin delete themselves
    if member_to_remove.user_id == current_user.id:
         raise HTTPException(status_code=400, detail="You cannot remove yourself from the project.")

    # 4. EXECUTE: Remove the member
    await session.delete(member_to_remove)
    await session.commit()
    
    return None

@router.get("/{project_id}/tasks", response_model=List[TaskResponse])
async def get_project_tasks(
    project_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Get all tasks for a specific project. Only Project Admins can view the full board.
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
            detail="Not authorized. Only project admins can view all project tasks."
        )

    # 2. FETCH TASKS
    result = await session.execute(
        select(Task).where(Task.project_id == project_id)
    )
    tasks = result.scalars().all()
    
    return tasks