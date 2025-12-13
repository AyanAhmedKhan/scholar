from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum, Boolean
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func
from app.db.database import Base
import enum

class ApplicationStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_VERIFICATION = "under_verification"
    DOCS_REQUIRED = "docs_required"
    APPROVED = "approved"
    REJECTED = "rejected"

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    scholarship_id = Column(Integer, ForeignKey("scholarships.id"), nullable=False)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.DRAFT)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    student = relationship("app.models.user.User", backref="applications")
    scholarship = relationship("app.models.scholarship.Scholarship")

class ApplicationDocument(Base):
    __tablename__ = "application_documents"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    document_format_id = Column(Integer, ForeignKey("document_formats.id"), nullable=False)
    file_path = Column(String(500), nullable=False)
    is_verified = Column(Boolean, default=False)
    remarks = Column(Text, nullable=True)
    
    application = relationship("Application", backref=backref("documents", cascade="all, delete-orphan"))
    document_format = relationship("app.models.scholarship.DocumentFormat")
