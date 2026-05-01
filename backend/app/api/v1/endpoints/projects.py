from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import EmailStr
from uuid import UUID
from datetime import date

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
    new_project = Project(
        name=project_in.name,
        description=project_in.description,
        created_by=current_user.id
    )
    session.add(new_project)
    await session.flush() 
    
    new_member = ProjectMember(
        user_id=current_user.id,
        project_id=new_project.id,
        role=RoleEnum.admin
    )
    session.add(new_member)
    
    await session.commit()
    await session.refresh(new_project)
    return new_project

@router.get("/", response_model=List[ProjectResponse])
async def get_my_projects(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    query = (
        select(Project)
        .join(ProjectMember, Project.id == ProjectMember.project_id)
        .where(ProjectMember.user_id == current_user.id)
    )
    result = await session.execute(query)
    return result.scalars().all()

@router.post("/{project_id}/members", response_model=ProjectMemberResponse)
async def add_project_member(
    project_id: UUID,
    member_in: ProjectMemberCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    admin_check = await session.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
            ProjectMember.role == RoleEnum.admin
        )
    )
    if not admin_check.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only project admins can add members.")

    user_search = await session.execute(select(User).where(User.email == member_in.email))
    target_user = user_search.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User with this email not found.")

    duplicate_check = await session.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == target_user.id
        )
    )
    if duplicate_check.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User is already a member.")

    new_member = ProjectMember(
        user_id=target_user.id,
        project_id=project_id,
        role=member_in.role
    )
    session.add(new_member)
    await session.commit()
    
    return {"user_id": new_member.user_id, "role": new_member.role, "email": target_user.email}

@router.get("/{project_id}/members", response_model=List[ProjectMemberResponse])
async def get_project_members(
    project_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    member_check = await session.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id
        )
    )
    if not member_check.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="You are not a member of this project.")

    result = await session.execute(
        select(ProjectMember.user_id, ProjectMember.role, User.name.label("email"))
        .join(User, ProjectMember.user_id == User.id)
        .where(ProjectMember.project_id == project_id)
    )
    return result.all()

@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_project_member(
    project_id: UUID,
    user_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    admin_check = await session.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
            ProjectMember.role == RoleEnum.admin
        )
    )
    if not admin_check.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only project admins can remove members.")

    member_to_remove_check = await session.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id
        )
    )
    member_to_remove = member_to_remove_check.scalar_one_or_none()
    if not member_to_remove:
        raise HTTPException(status_code=404, detail="User is not a member.")

    if member_to_remove.user_id == current_user.id:
         raise HTTPException(status_code=400, detail="You cannot remove yourself.")

    await session.delete(member_to_remove)
    await session.commit()
    return None

@router.get("/{project_id}/tasks", response_model=List[TaskResponse])
async def get_project_tasks(
    project_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    member_check = await session.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id
        )
    )
    if not member_check.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not authorized to view tasks.")

    result = await session.execute(
        select(Task, User.name) 
        .outerjoin(User, Task.assigned_to == User.id)
        .where(Task.project_id == project_id)
    )
    
    tasks_response = []
    for task_obj, actual_name in result.all():
        task_data = {column.name: getattr(task_obj, column.name) for column in task_obj.__table__.columns}
 
        task_data["assignee_email"] = actual_name
        tasks_response.append(task_data)
        
    return tasks_response