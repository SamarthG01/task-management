from pydantic import BaseModel
from typing import Dict

class DashboardResponse(BaseModel):
    total_tasks: int
    tasks_by_status: Dict[str, int]
    tasks_per_user: Dict[str, int]
    overdue_tasks: int