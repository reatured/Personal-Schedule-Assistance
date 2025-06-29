from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class SubTask(BaseModel):
    id: str
    text: str
    completed: bool

class Project(BaseModel):
    id: str
    name: str
    subTasks: List[SubTask]
    color: str

class ScheduledTask(BaseModel):
    id: str
    projectId: str
    projectName: str
    projectColor: str
    originalProjectSubTasks: List[SubTask]

class TimeSlot(BaseModel):
    id: str
    label: str
    section: str

class ScheduleData(BaseModel):
    version: str
    projects: List[Project]
    schedule: Dict[str, List[ScheduledTask]]
    nextColorIndex: int

class ScheduleBase(BaseModel):
    name: str
    data: ScheduleData
    version: str
    is_default: bool = False

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleUpdate(BaseModel):
    name: Optional[str] = None
    data: Optional[ScheduleData] = None
    version: Optional[str] = None
    is_default: Optional[bool] = None

class Schedule(ScheduleBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True 