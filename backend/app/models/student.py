from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, Boolean, DateTime, JSON
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func
from app.db.database import Base

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Personal
    enrollment_no = Column(String(50), unique=True)
    department = Column(String(100))
    branch = Column(String(100))
    mobile_number = Column(String(15))
    date_of_birth = Column(Date)
    gender = Column(String(10))
    father_name = Column(String(100))
    mother_name = Column(String(100))
    
    # Category
    category = Column(String(50)) # General, OBC, SC, ST
    minority_status = Column(Boolean, default=False)
    disability = Column(Boolean, default=False)
    disability_percentage = Column(Float, nullable=True)
    
    # Address
    permanent_address = Column(String(500))
    state = Column(String(100))
    district = Column(String(100))
    pincode = Column(String(10))
    current_address = Column(String(500))
    
    # Income
    annual_family_income = Column(Float)
    income_certificate_number = Column(String(100))
    issuing_authority = Column(String(100))
    income_certificate_validity_date = Column(Date)
    
    # Bank
    account_holder_name = Column(String(100))
    bank_name = Column(String(100))
    account_number = Column(String(50))
    ifsc_code = Column(String(20))
    branch_name = Column(String(100))
    
    # Education
    current_year_or_semester = Column(String(50))
    previous_exam_percentage = Column(Float)
    backlogs = Column(Integer, default=0)
    gap_year = Column(Boolean, default=False)
    
    # Parent/Guardian
    father_occupation = Column(String(100))
    mother_occupation = Column(String(100))
    guardian_annual_income = Column(Float, nullable=True)
    parents_govt_job = Column(Boolean, default=False)
    parent_contact_number = Column(String(15))
    
    # Residential
    residential_status = Column(String(20)) # Hosteler / Day Scholar
    
    user = relationship("app.models.user.User", backref=backref("profile", uselist=False))

class StudentDocument(Base):
    __tablename__ = "student_documents"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    document_type = Column(String(100)) # e.g., "income_certificate", "mark_sheet" - Keeping for backward compat or custom types
    document_format_id = Column(Integer, ForeignKey("document_formats.id"), nullable=True) # Link to master type
    file_path = Column(String(500), nullable=False)
    is_active = Column(Boolean, default=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    student = relationship("app.models.user.User", backref="documents")
    document_format = relationship("app.models.scholarship.DocumentFormat")
