from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.sql import func
from app.db.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Nullable for system actions
    action = Column(String(255), nullable=False) # e.g., "APPROVE_APPLICATION", "UPDATE_ROLE"
    target_type = Column(String(100), nullable=True) # e.g., "Application", "User"
    target_id = Column(String(100), nullable=True) # ID of the target entity
    details = Column(JSON, nullable=True) # Changed fields, remarks, etc.
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
