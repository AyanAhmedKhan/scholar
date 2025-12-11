from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime
from sqlalchemy.sql import func
from app.db.database import Base
import enum

class UserRole(str, enum.Enum):
    STUDENT = "student"
    GOFFICE = "goffice"
    ADMIN = "admin"
    DEPT_HEAD = "dept_head"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    google_id = Column(String(255), unique=True, nullable=True) # For students
    hashed_password = Column(String(255), nullable=True) # For admins/goffice
    role = Column(Enum(UserRole), default=UserRole.STUDENT)
    department = Column(String(100), nullable=True) # For Dept Heads
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships will be added in respective files or here if circular imports allow
