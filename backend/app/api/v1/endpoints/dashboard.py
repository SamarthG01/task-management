from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID

from app.db.session import get_db
from app.authentication.deps import get_current_user
from app.models.user import User
from app.models.project import ProjectMember
from app.models.task import Task
from app.schemas.dashboard import DashboardResponse

router = APIRouter()

@router.get("/{project_id}", response_model=DashboardResponse)
async def get_project_dashboard(
    project_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Get analytics for a specific project. User must be a member of the project.
    """
    # 1. SECURITY CHECK: Must be a member of the project to view its data
    member_check = await session.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id
        )
    )
    if not member_check.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="You are not a member of this project.")

    # 2. Fetch all tasks for this project
    result = await session.execute(select(Task).where(Task.project_id == project_id))
    tasks = result.scalars().all()

    # 3. Calculate Metrics
    total_tasks = len(tasks)
    tasks_by_status = {"todo": 0, "in_progress": 0, "done": 0}
    tasks_per_user = {}
    overdue_tasks = 0

    now = datetime.now(timezone.utc)

    for task in tasks:
        # Status count
        tasks_by_status[task.status.value] += 1

        # Per User count (using UUID string, or "unassigned")
        user_key = str(task.assigned_to) if task.assigned_to else "unassigned"
        tasks_per_user[user_key] = tasks_per_user.get(user_key, 0) + 1

        # Overdue check (past due date AND not done)
        if task.due_date and task.due_date < now and task.status.value != "done":
            overdue_tasks += 1

    return DashboardResponse(
        total_tasks=total_tasks,
        tasks_by_status=tasks_by_status,
        tasks_per_user=tasks_per_user,
        overdue_tasks=overdue_tasks
    )