from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import date, datetime
from app.models.user import UserRole
from app.models.application import ApplicationStatus

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole = UserRole.STUDENT

class UserCreate(UserBase):
    password: str



# Student Profile Schemas
class StudentProfileBase(BaseModel):
    enrollment_no: Optional[str] = None
    department: Optional[str] = None
    branch: Optional[str] = None
    mobile_number: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    category: Optional[str] = None
    minority_status: Optional[bool] = False
    disability: Optional[bool] = False
    disability_percentage: Optional[float] = None
    permanent_address: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    pincode: Optional[str] = None
    current_address: Optional[str] = None
    annual_family_income: Optional[float] = None
    income_certificate_number: Optional[str] = None
    issuing_authority: Optional[str] = None
    income_certificate_validity_date: Optional[date] = None
    account_holder_name: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    branch_name: Optional[str] = None
    current_year_or_semester: Optional[str] = None
    previous_exam_percentage: Optional[float] = None
    backlogs: Optional[int] = 0
    gap_year: Optional[bool] = False
    father_occupation: Optional[str] = None
    mother_occupation: Optional[str] = None
    guardian_annual_income: Optional[float] = None
    parents_govt_job: Optional[bool] = False
    parent_contact_number: Optional[str] = None
    residential_status: Optional[str] = None
    scholarship_switch_count: Optional[int] = 0

class StudentProfileCreate(StudentProfileBase):
    pass

class StudentProfileUpdate(StudentProfileBase):
    pass

class StudentProfileResponse(StudentProfileBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: int
    is_active: bool
    profile: Optional[StudentProfileResponse] = None
    class Config:
        from_attributes = True

# Document Schemas
class DocumentFormatBase(BaseModel):
    name: str
    description: Optional[str] = None
    file_type: str = "pdf"
    max_size_mb: int = 2
    order_index: int = 0
    is_mandatory_vault: bool = False

class DocumentFormatCreate(DocumentFormatBase):
    pass

class DocumentFormatResponse(DocumentFormatBase):
    id: int
    is_active: bool
    class Config:
        from_attributes = True

class StudentDocumentResponse(BaseModel):
    id: int
    document_type: str
    document_format_id: Optional[int] = None
    file_path: str
    is_active: bool
    uploaded_at: datetime
    class Config:
        from_attributes = True

# Document Format Schemas
class DocumentFormatBase(BaseModel):
    name: str
    description: Optional[str] = None
    file_type: str = "pdf"
    max_size_mb: int = 2

class DocumentFormatResponse(DocumentFormatBase):
    id: int
    is_active: bool
    class Config:
        from_attributes = True

# Scholarship Schemas
class ScholarshipDocumentRequirementBase(BaseModel):
    document_format_id: int
    order_index: int
    is_mandatory: bool = True
    is_renewal_required: bool = False
    renewal_instruction: Optional[str] = None
    instructions: Optional[str] = None

class ScholarshipDocumentRequirementCreate(ScholarshipDocumentRequirementBase):
    pass

class ScholarshipDocumentRequirementResponse(ScholarshipDocumentRequirementBase):
    id: int
    document_format: Optional[DocumentFormatResponse] = None
    class Config:
        from_attributes = True

class ScholarshipBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    eligibility_criteria: Optional[str] = None
    last_date: Optional[date] = None
    mutually_exclusive_ids: Optional[List[int]] = []
    application_link: Optional[str] = None
    
    # Eligibility Criteria
    min_percentage: Optional[float] = None
    min_12th_percentage: Optional[float] = None
    min_cgpa: Optional[float] = None
    max_family_income: Optional[float] = None
    allowed_categories: Optional[List[str]] = None
    allowed_departments: Optional[List[str]] = None
    allowed_years: Optional[List[str]] = None
    govt_job_allowed: Optional[bool] = True
    required_profile_fields: Optional[List[str]] = None  # List of profile field keys required for this scholarship
    
    # Batch/Session Management
    allowed_batches_new: Optional[List[int]] = None  # List of session_year IDs that can apply as NEW
    allowed_batches_renewal: Optional[List[int]] = None  # List of session_year IDs that can RENEW
    is_renewable: Optional[bool] = False  # Whether this scholarship supports renewal
    
    is_active: bool = True
    class Config:
        from_attributes = True

class ScholarshipCreate(ScholarshipBase):
    required_documents: Optional[List[ScholarshipDocumentRequirementCreate]] = []
    notify_students: bool = True

class ScholarshipResponse(ScholarshipBase):
    id: int
    required_documents: List[ScholarshipDocumentRequirementResponse] = []
    class Config:
        from_attributes = True

# Department Schemas
class DepartmentBase(BaseModel):
    name: str
    code: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    is_active: Optional[bool] = None

class DepartmentResponse(DepartmentBase):
    id: int
    is_active: bool
    class Config:
        from_attributes = True

class BranchBase(BaseModel):
    name: str
    code: Optional[str] = None
    department_id: int

class BranchCreate(BranchBase):
    pass

class BranchResponse(BranchBase):
    id: int
    is_active: bool
    class Config:
        from_attributes = True

class SessionYearBase(BaseModel):
    name: str

class SessionYearCreate(SessionYearBase):
    pass

class SessionYearUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None

class SessionYearResponse(SessionYearBase):
    id: int
    is_active: bool
    class Config:
        from_attributes = True

# Announcement Schemas
class AnnouncementBase(BaseModel):
    title: str
    content: str
    scholarship_id: Optional[int] = None

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementResponse(AnnouncementBase):
    id: int
    date_posted: date
    is_active: bool
    class Config:
        from_attributes = True

# Application Schemas
class ApplicationCreate(BaseModel):
    scholarship_id: int
    remarks: Optional[str] = None

class ApplicationDocumentResponse(BaseModel):
    id: int
    document_format_id: int
    file_path: str
    is_verified: bool
    remarks: Optional[str] = None
    document_format: Optional[DocumentFormatResponse] = None
    class Config:
        from_attributes = True

class ApplicationResponse(BaseModel):
    id: int
    student_id: int
    scholarship_id: int
    status: ApplicationStatus
    remarks: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    student: Optional[UserResponse] = None
    documents: List[ApplicationDocumentResponse] = []
    
    class Config:
        from_attributes = True

# --- Notice Schemas ---
class NoticeBase(BaseModel):
    title: str
    content: Optional[str] = None
    is_active: bool = True

class NoticeCreate(NoticeBase):
    pass

class NoticeUpdate(NoticeBase):
    pass

class NoticeResponse(NoticeBase):
    id: int
    created_at: datetime
    created_by: int

    class Config:
        from_attributes = True

# Switch Scholarship Schema
class SwitchScholarshipRequest(BaseModel):
    target_scholarship_id: int
