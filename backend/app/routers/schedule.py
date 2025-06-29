from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json

from ..core.database import get_db
from ..models.user import User
from ..models.schedule import Schedule
from ..schemas.schedule import Schedule as ScheduleSchema, ScheduleCreate, ScheduleUpdate
from ..dependencies import get_current_user

router = APIRouter(prefix="/schedules", tags=["schedules"])

@router.post("/", response_model=ScheduleSchema)
def create_schedule(
    schedule: ScheduleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # If setting as default, unset other defaults first
    if schedule.is_default:
        db.query(Schedule).filter(
            Schedule.user_id == current_user.id,
            Schedule.is_default == True
        ).update({"is_default": False})
    
    # Create new schedule
    db_schedule = Schedule(
        user_id=current_user.id,
        name=schedule.name,
        data=json.dumps(schedule.data.dict()),
        version=schedule.version,
        is_default=schedule.is_default
    )
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    
    # Convert data back to dict for response
    db_schedule.data = json.loads(db_schedule.data)
    return db_schedule

@router.get("/", response_model=List[ScheduleSchema])
def get_schedules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schedules = db.query(Schedule).filter(Schedule.user_id == current_user.id).all()
    
    # Convert data back to dict for response
    for schedule in schedules:
        schedule.data = json.loads(schedule.data)
    
    return schedules

@router.get("/default", response_model=ScheduleSchema)
def get_default_schedule(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schedule = db.query(Schedule).filter(
        Schedule.user_id == current_user.id,
        Schedule.is_default == True
    ).first()
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No default schedule found"
        )
    
    # Convert data back to dict for response
    schedule.data = json.loads(schedule.data)
    return schedule

@router.put("/{schedule_id}", response_model=ScheduleSchema)
def update_schedule(
    schedule_id: int,
    schedule_update: ScheduleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get existing schedule
    db_schedule = db.query(Schedule).filter(
        Schedule.id == schedule_id,
        Schedule.user_id == current_user.id
    ).first()
    
    if not db_schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )
    
    # Update fields
    update_data = schedule_update.dict(exclude_unset=True)
    
    if "data" in update_data:
        update_data["data"] = json.dumps(update_data["data"].dict())
    
    # If setting as default, unset other defaults first
    if update_data.get("is_default"):
        db.query(Schedule).filter(
            Schedule.user_id == current_user.id,
            Schedule.is_default == True
        ).update({"is_default": False})
    
    for field, value in update_data.items():
        setattr(db_schedule, field, value)
    
    db.commit()
    db.refresh(db_schedule)
    
    # Convert data back to dict for response
    db_schedule.data = json.loads(db_schedule.data)
    return db_schedule

@router.delete("/{schedule_id}")
def delete_schedule(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get existing schedule
    db_schedule = db.query(Schedule).filter(
        Schedule.id == schedule_id,
        Schedule.user_id == current_user.id
    ).first()
    
    if not db_schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )
    
    db.delete(db_schedule)
    db.commit()
    
    return {"message": "Schedule deleted successfully"} 