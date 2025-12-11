from sqlalchemy import Column, Integer, String, Text, Date, Boolean, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from app.db.database import Base

class Scholarship(Base):
    __tablename__ = "scholarships"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100)) # e.g., Merit, Need-based
    eligibility_criteria = Column(Text)
    last_date = Column(Date)
    mutually_exclusive_ids = Column(JSON, nullable=True) # List of scholarship IDs
    application_link = Column(String(500), nullable=True) # External application link
    
    # Eligibility Criteria
    min_percentage = Column(Float, nullable=True) # Deprecated or generic
    min_12th_percentage = Column(Float, nullable=True)
    min_cgpa = Column(Float, nullable=True)
    max_family_income = Column(Float, nullable=True)
    allowed_categories = Column(JSON, nullable=True) # ["SC", "ST"]
    allowed_departments = Column(JSON, nullable=True)
    allowed_years = Column(JSON, nullable=True)
    govt_job_allowed = Column(Boolean, default=True)
    required_profile_fields = Column(JSON, nullable=True)  # List of profile field keys required for this scholarship
    
    # Batch/Session Management
    allowed_batches_new = Column(JSON, nullable=True)  # List of session_year IDs that can apply as NEW
    allowed_batches_renewal = Column(JSON, nullable=True)  # List of session_year IDs that can RENEW
    is_renewable = Column(Boolean, default=False)  # Whether this scholarship supports renewal
    
    is_active = Column(Boolean, default=True)
    
    required_documents = relationship("ScholarshipDocumentRequirement", back_populates="scholarship", order_by="ScholarshipDocumentRequirement.order_index")

class DocumentCategory(Base):
    __tablename__ = "document_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    order = Column(Integer, default=0)
    active = Column(Boolean, default=True)

class DocumentFormat(Base):
    __tablename__ = "document_formats"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False) # Changed title to name for consistency with other code
    description = Column(Text)
    # order = Column(Integer, default=0) # Global order not needed if per-scholarship
    file_type = Column(String(50), default="pdf")
    max_size_mb = Column(Integer, default=2)
    order_index = Column(Integer, default=0)
    is_mandatory_vault = Column(Boolean, default=False) # If true, student MUST upload this to vault
    is_active = Column(Boolean, default=True) # Changed active to is_active

class ScholarshipDocumentRequirement(Base):
    __tablename__ = "scholarship_document_requirements"
    
    id = Column(Integer, primary_key=True, index=True)
    scholarship_id = Column(Integer, ForeignKey("scholarships.id"), nullable=False)
    document_format_id = Column(Integer, ForeignKey("document_formats.id"), nullable=False)
    order_index = Column(Integer, default=0)
    is_mandatory = Column(Boolean, default=True)
    is_renewal_required = Column(Boolean, default=False)
    renewal_instruction = Column(Text, nullable=True)
    
    scholarship = relationship("Scholarship", back_populates="required_documents")
    document_format = relationship("DocumentFormat")

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    scholarship_id = Column(Integer, ForeignKey("scholarships.id"), nullable=True) # Nullable for general announcements
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    date_posted = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)

    scholarship = relationship("Scholarship", backref="announcements")
