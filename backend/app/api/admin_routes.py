from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.models.user import User, UserRole
from app.models.student import StudentProfile, StudentDocument
from app.models.application import Application, ApplicationStatus
from app.models.scholarship import Scholarship
from app.schemas import schemas
from app.api import deps
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# --- Super Admin Routes ---

from app.api.pagination import PaginationParams

@router.get("/users", response_model=List[schemas.UserResponse])
def get_users(
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN])),
) -> Any:
    """
    Get all users (Super Admin only)
    """
    return db.query(User).offset(pagination.skip).limit(pagination.limit).all()

class UserRoleUpdate(BaseModel):
    role: UserRole

@router.put("/users/{user_id}/role", response_model=schemas.UserResponse)
def update_user_role(
    user_id: int,
    role_update: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN])),
) -> Any:
    """
    Update user role (Super Admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role_update.role
    db.commit()
    db.refresh(user)
    
    log_action(
        db, 
        action="UPDATE_ROLE", 
        user_id=current_user.id, 
        target_type="User", 
        target_id=str(user.id), 
        details={"new_role": role_update.role}
    )
    
    return user

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN])),
) -> Any:
    """
    Delete a user from the database (Super Admin only)
    This will also delete related records (profile, applications, documents)
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Prevent self-deletion
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Save user info for logging before deletion
    user_email = user.email
    user_role = user.role.value
    
    try:
        # Unlink AuditLogs
        from app.models.audit import AuditLog
        db.query(AuditLog).filter(AuditLog.user_id == user_id).update({AuditLog.user_id: None})
        
        # Unlink Notices
        from app.models.notice import Notice
        db.query(Notice).filter(Notice.created_by == user_id).update({Notice.created_by: None})

        # Delete related StudentProfile if exists
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
        if profile:
            db.delete(profile)
        
        # Delete related StudentDocuments
        documents = db.query(StudentDocument).filter(StudentDocument.student_id == user_id).all()
        for doc in documents:
            db.delete(doc)
        
        # Delete related Applications
        applications = db.query(Application).filter(Application.student_id == user_id).all()
        for app in applications:
            db.delete(app)
        
        # Delete the user
        db.delete(user)
        db.commit()
        
        # Log the action
        try:
            log_action(
                db,
                action="DELETE_USER",
                user_id=current_user.id,
                target_type="User",
                target_id=str(user_id),
                details={"email": user_email, "role": user_role}
            )
            logger.info(f"User deleted: {user_email} (ID: {user_id}) by admin {current_user.id}")
        except Exception as e:
            logger.error(f"Failed to log user deletion: {e}")
        
        return {"message": f"User {user_email} deleted successfully"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")

@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN])),
):
    """
    Get super admin dashboard stats
    """
    total_users = db.query(User).count()
    total_applications = db.query(Application).count()
    pending_verifications = db.query(Application).filter(Application.status == ApplicationStatus.UNDER_VERIFICATION).count()
    total_scholarships = db.query(Scholarship).count()
    
    return {
        "total_users": total_users,
        "total_applications": total_applications,
        "pending_verifications": pending_verifications,
        "total_scholarships": total_scholarships
    }

# --- General Office / Admin Routes ---

@router.get("/applications", response_model=List[schemas.ApplicationResponse])
def get_all_applications(
    status: Optional[ApplicationStatus] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.GOFFICE])),
) -> Any:
    """
    Get all applications (Admin & GOffice)
    """
    from sqlalchemy.orm import joinedload
    from app.models.application import Application, ApplicationDocument
    from app.models.user import User
    query = db.query(Application).options(
        joinedload(Application.documents).joinedload(ApplicationDocument.document_format),
        joinedload(Application.student).joinedload(User.profile)
    )
    if status:
        query = query.filter(Application.status == status)
    return query.offset(skip).limit(limit).all()

class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus
    remarks: Optional[str] = None

@router.put("/applications/{application_id}/status", response_model=schemas.ApplicationResponse)
def update_application_status(
    application_id: int,
    status_update: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.GOFFICE])),
) -> Any:
    """
    Update application status (Admin & GOffice)
    """
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    application.status = status_update.status
    if status_update.remarks:
        application.remarks = status_update.remarks
    
    db.commit()
    db.refresh(application)
    
    log_action(
        db, 
        action="UPDATE_APPLICATION_STATUS", 
        user_id=current_user.id, 
        target_type="Application", 
        target_id=str(application.id), 
        details={"new_status": status_update.status, "remarks": status_update.remarks}
    )
    
    # Email Notification
    # Email Notification
    try:
        from app.tasks.email_tasks import send_notification_task
        student_profile = db.query(StudentProfile).filter(StudentProfile.user_id == application.student_id).first()
        student_user = db.query(User).filter(User.id == application.student_id).first()
        
        if student_user:
            scholarship = db.query(Application).filter(Application.id == application_id).first().scholarship
            
            notification_type = None
            if status_update.status == ApplicationStatus.APPROVED:
                notification_type = "application_approved"
            elif status_update.status == ApplicationStatus.REJECTED:
                notification_type = "application_rejected"
            elif status_update.status == ApplicationStatus.DOCS_REQUIRED:
                notification_type = "docs_required"
                
            if notification_type:
                send_notification_task.delay(
                    notification_type=notification_type,
                    recipients=[student_user.email],
                    data={
                        "student_name": student_user.full_name,
                        "scholarship_name": scholarship.name,
                        "remarks": status_update.remarks
                    }
                )
    except Exception as e:
        logger.error(f"Failed to send email notification: {e}")
    
    return application

class DocumentVerificationUpdate(BaseModel):
    is_verified: bool
    remarks: Optional[str] = None

@router.put("/applications/documents/{doc_id}/verify")
def verify_document(
    doc_id: int,
    verification: DocumentVerificationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.GOFFICE])),
):
    """
    Verify or reject a specific document
    """
    from app.models.application import ApplicationDocument
    
    doc = db.query(ApplicationDocument).filter(ApplicationDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    doc.is_verified = verification.is_verified
    doc.remarks = verification.remarks
    db.commit()
    
    log_action(
        db, 
        action="VERIFY_DOCUMENT", 
        user_id=current_user.id, 
        target_type="ApplicationDocument", 
        target_id=str(doc.id), 
        details={"is_verified": verification.is_verified, "remarks": verification.remarks}
    )
    
    # Email if rejected or docs required (Optional, usually handled at app level, but good for granular feedback)
    # If document is rejected, we might want to notify student.
    # Email if rejected or docs required (Optional, usually handled at app level, but good for granular feedback)
    # If document is rejected, we might want to notify student.
    if not verification.is_verified and verification.remarks:
         try:
             from app.tasks.email_tasks import send_notification_task
             app = doc.application
             student_user = db.query(User).filter(User.id == app.student_id).first()
             if student_user:
                 send_notification_task.delay(
                    notification_type="docs_required", # Reusing docs_required template
                    recipients=[student_user.email],
                    data={
                        "student_name": student_user.full_name,
                        "scholarship_name": "Application Document Update",
                        "remarks": f"Document '{doc.document_format.name}' issue: {verification.remarks}"
                    }
                )
         except Exception as e:
             print(f"Failed to send email notification: {e}")
    
    return {"message": "Document updated", "is_verified": doc.is_verified}

# --- Dept Head Routes ---

@router.get("/dept/students", response_model=List[schemas.StudentProfileResponse])
def get_dept_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.DEPT_HEAD, UserRole.ADMIN])),
) -> Any:
    """
    Get students in the department
    """
    query = db.query(StudentProfile)
    if current_user.role == UserRole.DEPT_HEAD and current_user.department:
        query = query.filter(StudentProfile.department == current_user.department)
    return query.all()

@router.get("/dept/applications", response_model=List[schemas.ApplicationResponse])
def get_dept_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.DEPT_HEAD, UserRole.ADMIN])),
) -> Any:
    """
    Get applications for the department
    """
    query = db.query(Application).join(StudentProfile, Application.student_id == StudentProfile.user_id)
    if current_user.role == UserRole.DEPT_HEAD and current_user.department:
        query = query.filter(StudentProfile.department == current_user.department)
    return query.all()

@router.get("/dept/stats")
def get_dept_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.DEPT_HEAD, UserRole.ADMIN])),
):
    """
    Get department statistics
    """
    student_query = db.query(StudentProfile)
    app_query = db.query(Application).join(StudentProfile, Application.student_id == StudentProfile.user_id)
    
    if current_user.role == UserRole.DEPT_HEAD and current_user.department:
        student_query = student_query.filter(StudentProfile.department == current_user.department)
        app_query = app_query.filter(StudentProfile.department == current_user.department)
    
    total_students = student_query.count()
    total_applications = app_query.count()
    pending_applications = app_query.filter(Application.status == ApplicationStatus.SUBMITTED).count()
    approved_applications = app_query.filter(Application.status == ApplicationStatus.APPROVED).count()
    
    return {
        "total_students": total_students,
        "total_applications": total_applications,
        "pending_applications": pending_applications,
        "approved_applications": approved_applications
    }

    return {
        "total_students": total_students,
        "total_applications": total_applications,
        "pending_applications": pending_applications
    }

# --- Super Admin Enhancements ---

from app.core.audit_logger import log_action
from app.models.audit import AuditLog
from app.models.university import Department, SessionYear
from app.schemas import schemas
from fastapi.responses import StreamingResponse
import csv
import io

@router.get("/audit-logs")
def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN])),
):
    """
    Get audit logs (Super Admin only)
    """
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

@router.get("/server-logs")
def get_server_logs(
    lines: int = 1000,
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN])),
):
    """
    Get server logs (Super Admin only)
    """
    import os
    
    log_file = "server.log" # Assumes in root or current working dir logic
    
    # Try different locations if not found
    if not os.path.exists(log_file):
        # try backend/server.log if running from root
        if os.path.exists("backend/server.log"):
            log_file = "backend/server.log"
        elif os.path.exists("../server.log"):
            log_file = "../server.log"
        else:
             return {"logs": ["Log file not found."]}

    try:
        # Efficiently read last N lines
        with open(log_file, "r") as f:
            # Simple approach for now
            all_lines = f.readlines()
            return {"logs": all_lines[-lines:]}
    except Exception as e:
        return {"logs": [f"Error reading log file: {str(e)}"]}

@router.get("/analytics/dashboard")
def get_analytics_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.GOFFICE])),
):
    """
    Get comprehensive analytics for dashboard (Admin & GOffice)
    """
    # Department-wise application distribution
    dept_stats = db.query(
        StudentProfile.department, 
        func.count(Application.id)
    ).join(
        Application, StudentProfile.user_id == Application.student_id
    ).group_by(StudentProfile.department).all()
    dept_data = [{"name": d[0] or "Unknown", "value": d[1]} for d in dept_stats]
    
    # Category-wise
    cat_stats = db.query(StudentProfile.category, func.count(StudentProfile.id)).group_by(StudentProfile.category).all()
    cat_data = [{"name": c[0] or "Unknown", "value": c[1]} for c in cat_stats]
    
    # Gender-wise
    gender_stats = db.query(StudentProfile.gender, func.count(StudentProfile.id)).group_by(StudentProfile.gender).all()
    gender_data = [{"name": g[0] or "Unknown", "value": g[1]} for g in gender_stats]
    
    # Application Status
    status_stats = db.query(Application.status, func.count(Application.id)).group_by(Application.status).all()
    status_data = [{"name": str(s[0].value) if hasattr(s[0], 'value') else str(s[0]), "value": s[1]} for s in status_stats]
    
    return {
        "department_distribution": dept_data,
        "category_distribution": cat_data,
        "gender_distribution": gender_data,
        "application_status": status_data
    }

@router.get("/export/{export_type}")
def export_data(
    export_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.GOFFICE])),
):
    """
    Export data as CSV
    """
    stream = io.StringIO()
    writer = csv.writer(stream)
    
    if export_type == "applicants":
        writer.writerow(["ID", "Name", "Email", "Role", "Joined At"])
        users = db.query(User).all()
        for user in users:
            writer.writerow([user.id, user.full_name, user.email, user.role, user.created_at])
            
    elif export_type == "applications":
        writer.writerow(["App ID", "Student ID", "Scholarship ID", "Status", "Remarks", "Created At"])
        apps = db.query(Application).all()
        for app in apps:
            writer.writerow([app.id, app.student_id, app.scholarship_id, app.status, app.remarks, app.created_at])
            
    else:
        raise HTTPException(status_code=400, detail="Invalid export type")
        
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename={export_type}.csv"
    return response

# --- Communication Routes ---

class EmailRequest(BaseModel):
    subject: str
    body: str
    target_group: str # "all", "department", "scholarship", "custom"
    target_id: Optional[str] = None # Dept Name, Scholarship ID, etc.
    custom_recipients: Optional[List[str]] = [] # List of emails

@router.post("/communications/email/send")
def send_custom_email(
    email_req: EmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.GOFFICE])),
):
    """
    Send custom email to students
    """
    try:
        from app.tasks.email_tasks import send_notification_task
        
        recipients = []
        
        if email_req.target_group == "all":
            users = db.query(User).filter(User.role == UserRole.STUDENT).all()
            recipients = [u.email for u in users]
            
        elif email_req.target_group == "department":
            if not email_req.target_id:
                 raise HTTPException(status_code=400, detail="Department name required")
            profiles = db.query(StudentProfile).filter(StudentProfile.department == email_req.target_id).all()
            # Get emails from User table
            user_ids = [p.user_id for p in profiles]
            users = db.query(User).filter(User.id.in_(user_ids)).all()
            recipients = [u.email for u in users]
            
        elif email_req.target_group == "branch":
            if not email_req.target_id:
                 raise HTTPException(status_code=400, detail="Branch name required")
            profiles = db.query(StudentProfile).filter(StudentProfile.branch == email_req.target_id).all()
            # Get emails from User table
            user_ids = [p.user_id for p in profiles]
            users = db.query(User).filter(User.id.in_(user_ids)).all()
            recipients = [u.email for u in users]
            
        elif email_req.target_group == "scholarship":
            if not email_req.target_id:
                 raise HTTPException(status_code=400, detail="Scholarship ID required")
            # Get applicants
            apps = db.query(Application).filter(Application.scholarship_id == int(email_req.target_id)).all()
            user_ids = [app.student_id for app in apps]
            users = db.query(User).filter(User.id.in_(user_ids)).all()
            recipients = [u.email for u in users]
            
        elif email_req.target_group == "custom":
            recipients = email_req.custom_recipients
            
        if not recipients:
            return {"message": "No recipients found", "count": 0}
            
        # Send in batches? Celery handles it.
        send_notification_task.delay(
            notification_type="custom_message",
            recipients=recipients,
            data={
                "subject": email_req.subject,
                "body": email_req.body
            }
        )
    except Exception as e:
        logger.error(f"Failed to send email notification: {e}")
        return {"message": "Failed to queue email", "error": str(e)}
    
    return {"message": "Email queued", "count": len(recipients)}

# --- Department Management Routes ---

@router.get("/departments", response_model=List[schemas.DepartmentResponse])
def get_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN])),
) -> Any:
    """
    Get all departments (Super Admin only)
    """
    return db.query(Department).order_by(Department.name).all()

@router.post("/departments", response_model=schemas.DepartmentResponse)
def create_department(
    department_in: schemas.DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN])),
) -> Any:
    """
    Create a new department (Super Admin only)
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Check if department with same name or code exists
    existing = db.query(Department).filter(
        (Department.name == department_in.name) | 
        (Department.code == department_in.code)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department with this name or code already exists")
    
    department = Department(
        name=department_in.name,
        code=department_in.code,
        is_active=True
    )
    db.add(department)
    db.commit()
    db.refresh(department)
    
    try:
        log_action(
            db,
            action="CREATE_DEPARTMENT",
            user_id=current_user.id,
            target_type="Department",
            target_id=str(department.id),
            details={"name": department.name, "code": department.code}
        )
        logger.info(f"Department created: {department.name} by admin {current_user.id}")
    except Exception as e:
        logger.error(f"Failed to log department creation: {e}")
        # Don't fail the request if logging fails
    
    return department

@router.put("/departments/{department_id}", response_model=schemas.DepartmentResponse)
def update_department(
    department_id: int,
    department_in: schemas.DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN])),
) -> Any:
    """
    Update a department (Super Admin only)
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Check for duplicates if name/code is being changed
    if department_in.name and department_in.name != department.name:
        existing = db.query(Department).filter(
            Department.name == department_in.name,
            Department.id != department_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Department with this name already exists")
    
    if department_in.code and department_in.code != department.code:
        existing = db.query(Department).filter(
            Department.code == department_in.code,
            Department.id != department_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Department with this code already exists")
    
    if department_in.name:
        department.name = department_in.name
    if department_in.code is not None:
        department.code = department_in.code
    if department_in.is_active is not None:
        department.is_active = department_in.is_active
    
    db.commit()
    db.refresh(department)
    
    try:
        log_action(
            db,
            action="UPDATE_DEPARTMENT",
            user_id=current_user.id,
            target_type="Department",
            target_id=str(department.id),
            details=department_in.dict(exclude_unset=True)
        )
        logger.info(f"Department updated: {department.name} by admin {current_user.id}")
    except Exception as e:
        logger.error(f"Failed to log department update: {e}")
    
    return department

@router.delete("/departments/{department_id}")
def delete_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN])),
):
    """
    Soft delete a department (Super Admin only)
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Check if department is in use
    student_count = db.query(StudentProfile).filter(StudentProfile.department == department.name).count()
    if student_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete department. {student_count} students are associated with it."
        )
    
    department.is_active = False
    db.commit()
    
    try:
        log_action(
            db,
            action="DELETE_DEPARTMENT",
            user_id=current_user.id,
            target_type="Department",
            target_id=str(department.id),
            details={"name": department.name}
        )
        logger.info(f"Department deactivated: {department.name} by admin {current_user.id}")
    except Exception as e:
        logger.error(f"Failed to log department deletion: {e}")
    
    return {"message": "Department deactivated successfully"}

# --- Session Management Routes ---

@router.get("/sessions", response_model=List[schemas.SessionYearResponse])
def get_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN])),
) -> Any:
    """
    Get all sessions (Super Admin only)
    """
    return db.query(SessionYear).order_by(SessionYear.name.desc()).all()

@router.post("/sessions", response_model=schemas.SessionYearResponse)
def create_session(
    session_in: schemas.SessionYearCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN])),
) -> Any:
    """
    Create a new session (Super Admin only)
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Check if session with same name exists
    existing = db.query(SessionYear).filter(SessionYear.name == session_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Session with this name already exists")
    
    session = SessionYear(
        name=session_in.name,
        is_active=True
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    try:
        log_action(
            db,
            action="CREATE_SESSION",
            user_id=current_user.id,
            target_type="SessionYear",
            target_id=str(session.id),
            details={"name": session.name}
        )
        logger.info(f"Session created: {session.name} by admin {current_user.id}")
    except Exception as e:
        logger.error(f"Failed to log session creation: {e}")
    
    return session

@router.put("/sessions/{session_id}", response_model=schemas.SessionYearResponse)
def update_session(
    session_id: int,
    session_in: schemas.SessionYearUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN])),
) -> Any:
    """
    Update a session (Super Admin only)
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    session = db.query(SessionYear).filter(SessionYear.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check for duplicates if name is being changed
    if session_in.name and session_in.name != session.name:
        existing = db.query(SessionYear).filter(
            SessionYear.name == session_in.name,
            SessionYear.id != session_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Session with this name already exists")
    
    if session_in.name:
        session.name = session_in.name
    if session_in.is_active is not None:
        session.is_active = session_in.is_active
    
    db.commit()
    db.refresh(session)
    
    try:
        log_action(
            db,
            action="UPDATE_SESSION",
            user_id=current_user.id,
            target_type="SessionYear",
            target_id=str(session.id),
            details=session_in.dict(exclude_unset=True)
        )
        logger.info(f"Session updated: {session.name} by admin {current_user.id}")
    except Exception as e:
        logger.error(f"Failed to log session update: {e}")
    
    return session

@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN])),
):
    """
    Soft delete a session (Super Admin only)
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    session = db.query(SessionYear).filter(SessionYear.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.is_active = False
    db.commit()
    
    try:
        log_action(
            db,
            action="DELETE_SESSION",
            user_id=current_user.id,
            target_type="SessionYear",
            target_id=str(session.id),
            details={"name": session.name}
        )
        logger.info(f"Session deactivated: {session.name} by admin {current_user.id}")
    except Exception as e:
        logger.error(f"Failed to log session deletion: {e}")
    
    return {"message": "Session deactivated successfully"}

@router.post("/reset-password-temp")
def reset_password_temp(
    db: Session = Depends(get_db)
):
    from app.core.security import get_password_hash
    email = "ayanakhan@example.com"
    password = "admin"
    
    user = db.query(User).filter(User.email == email).first()
    if user:
        user.hashed_password = get_password_hash(password)
        user.role = UserRole.ADMIN
        user.is_active = True
    else:
        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            full_name="Ayana Khan",
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(user)
    
    db.commit()
    return {"message": "Admin password reset to 'admin'"}
