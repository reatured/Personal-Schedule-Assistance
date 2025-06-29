from .user import User
from .schedule import Schedule

# Add relationship back_populates
User.schedules = relationship("Schedule", back_populates="user") 