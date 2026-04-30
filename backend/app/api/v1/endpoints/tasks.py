from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.schemas.task import TaskUpdate
from uuid import UUID

from app.db.session import get_db
from app.authentication.deps import get_current_user
from app.models.user import User
from app.models.project import ProjectMember, RoleEnum
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskResponse

router = APIRouter()

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: TaskCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Create a new task. Only Project Admins can do this.
    """
    # 1. RBAC CHECK: Is the user an Admin of this project?
    admin_check = await session.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == task_in.project_id,
            ProjectMember.user_id == current_user.id,
            ProjectMember.role == RoleEnum.admin
        )
    )
    if not admin_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Only project admins can create and assign tasks."
        )

    # 2. CREATE TASK
    new_task = Task(
        project_id=task_in.project_id,
        title=task_in.title,
        description=task_in.description,
        status=task_in.status,
        priority=task_in.priority,
        due_date=task_in.due_date,
        assigned_to=task_in.assigned_to,
        created_by=current_user.id
    )
    
    session.add(new_task)
    await session.commit()
    await session.refresh(new_task)
    
    return new_task

@router.get("/my-tasks", response_model=List[TaskResponse])
async def get_my_tasks(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Get all tasks assigned specifically to the logged-in user.
    """
    query = select(Task).where(Task.assigned_to == current_user.id)
    result = await session.execute(query)
    tasks = result.scalars().all()
    
    return tasks

@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task_status(
    task_id: UUID,
    task_update: TaskUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Update a task's status. Members can update their assigned tasks. Admins can update any task.
    """
    # 1. Fetch the task
    result = await session.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # 2. SECURITY CHECK: Is user an Admin OR the Assignee?
    admin_check = await session.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == task.project_id,
            ProjectMember.user_id == current_user.id,
            ProjectMember.role == RoleEnum.admin
        )
    )
    is_admin = admin_check.scalar_one_or_none() is not None

    if not is_admin and task.assigned_to != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not authorized. You can only update tasks assigned to you."
        )

    # 3. UPDATE TASK
    if task_update.status:
        task.status = task_update.status
        
    await session.commit()
    await session.refresh(task)
    
    return task