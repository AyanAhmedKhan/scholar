from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User, UserRole
from app.models.scholarship import Scholarship, ScholarshipDocumentRequirement, DocumentFormat
from app.schemas import schemas
from app.api import deps

router = APIRouter()

@router.get("/", response_model=List[schemas.ScholarshipResponse])
def read_scholarships(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> Any:
    """
    Retrieve scholarships.
    """
    scholarships = db.query(Scholarship).filter(Scholarship.is_active == True).offset(skip).limit(limit).all()
    return scholarships

@router.get("/public", response_model=List[schemas.ScholarshipResponse])
def read_public_scholarships(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> Any:
    """
    Retrieve public active scholarships (No Auth)
    """
    scholarships = db.query(Scholarship).filter(Scholarship.is_active == True).offset(skip).limit(limit).all()
    return scholarships

from app.core.eligibility import check_eligibility
from app.models.student import StudentProfile

@router.get("/{scholarship_id}/check-eligibility")
def check_scholarship_eligibility(
    scholarship_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Check if current user is eligible for the scholarship
    """
    scholarship = db.query(Scholarship).filter(Scholarship.id == scholarship_id).first()
    if not scholarship:
        raise HTTPException(status_code=404, detail="Scholarship not found")
        
    student_profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not student_profile:
        raise HTTPException(status_code=400, detail="Student profile not found. Please complete your profile first.")
        
    result = check_eligibility(student_profile, scholarship)
    return result

import logging

# Configure logger
logger = logging.getLogger(__name__)

@router.post("/", response_model=schemas.ScholarshipResponse)
def create_scholarship(
    scholarship_in: schemas.ScholarshipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.GOFFICE])),
) -> Any:
    """
    Create new scholarship (Admin/GOffice)
    """
    try:
        logger.info(f"Creating scholarship: {scholarship_in.name}")
        logger.info(f"Payload: {scholarship_in.dict()}")

        scholarship = Scholarship(
            name=scholarship_in.name,
            description=scholarship_in.description,
            category=scholarship_in.category,
            eligibility_criteria=scholarship_in.eligibility_criteria,
            last_date=scholarship_in.last_date,
            mutually_exclusive_ids=scholarship_in.mutually_exclusive_ids,
            allowed_batches_new=scholarship_in.allowed_batches_new,
            allowed_batches_renewal=scholarship_in.allowed_batches_renewal,
            required_profile_fields=scholarship_in.required_profile_fields,
            is_renewable=scholarship_in.is_renewable or False,
            application_link=scholarship_in.application_link,
            is_active=True
        )
        db.add(scholarship)
        db.flush() # Get ID
        logger.info(f"Scholarship created with ID: {scholarship.id}")

        if scholarship_in.required_documents:
            for req in scholarship_in.required_documents:
                doc_req = ScholarshipDocumentRequirement(
                    scholarship_id=scholarship.id,
                    document_format_id=req.document_format_id,
                    order_index=req.order_index,
                    is_mandatory=req.is_mandatory
                )
                db.add(doc_req)
            logger.info("Document requirements added")

        db.commit()
        db.refresh(scholarship)
        logger.info("Database commit successful")
        
        # Email Notification: New Scholarship
        # Logic: Notify all students who match category/dept? Or just all?
        # Requirement: "Scholarship Added to all students"
        
        # Get all students (This might be heavy, in prod use batching)
        users = db.query(User).filter(User.role == UserRole.STUDENT).all()
        recipients = [u.email for u in users]
        
        try:
            from app.tasks.email_tasks import send_notification_task
            if recipients and scholarship_in.notify_students:
                logger.info(f"Sending notifications to {len(recipients)} students")
                send_notification_task.delay(
                    notification_type="scholarship_added",
                    recipients=recipients,
                    data={
                        "scholarship_name": scholarship.name,
                        "category": scholarship.category,
                        "last_date": str(scholarship.last_date)
                    }
                )
            else:
                logger.info("Notifications skipped (disabled or no recipients)")
        except Exception as e:
            logger.error(f"Failed to send email notification: {e}")
            # Do not raise, just log
            
        return scholarship

    except Exception as e:
        logger.error(f"Error creating scholarship: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.get("/{scholarship_id}", response_model=schemas.ScholarshipResponse)
def read_scholarship(
    scholarship_id: int,
    db: Session = Depends(get_db),
) -> Any:
    """
    Get scholarship by ID with all related documents.
    """
    from sqlalchemy.orm import joinedload
    scholarship = db.query(Scholarship).options(
        joinedload(Scholarship.required_documents).joinedload(ScholarshipDocumentRequirement.document_format)
    ).filter(Scholarship.id == scholarship_id).first()
    if not scholarship:
        raise HTTPException(status_code=404, detail="Scholarship not found")
    return scholarship

@router.put("/{scholarship_id}", response_model=schemas.ScholarshipResponse)
def update_scholarship(
    scholarship_id: int,
    scholarship_in: schemas.ScholarshipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.GOFFICE])),
) -> Any:
    """
    Update scholarship
    """
    scholarship = db.query(Scholarship).filter(Scholarship.id == scholarship_id).first()
    if not scholarship:
        raise HTTPException(status_code=404, detail="Scholarship not found")
        
    scholarship.name = scholarship_in.name
    scholarship.description = scholarship_in.description
    scholarship.category = scholarship_in.category
    scholarship.eligibility_criteria = scholarship_in.eligibility_criteria
    scholarship.last_date = scholarship_in.last_date
    scholarship.mutually_exclusive_ids = scholarship_in.mutually_exclusive_ids
    scholarship.allowed_batches_new = scholarship_in.allowed_batches_new
    scholarship.allowed_batches_renewal = scholarship_in.allowed_batches_renewal
    scholarship.required_profile_fields = scholarship_in.required_profile_fields
    scholarship.is_renewable = scholarship_in.is_renewable or False
    scholarship.application_link = scholarship_in.application_link
    
    # Update requirements: Delete old and add new (Simple approach)
    db.query(ScholarshipDocumentRequirement).filter(ScholarshipDocumentRequirement.scholarship_id == scholarship.id).delete()
    
    if scholarship_in.required_documents:
        for req in scholarship_in.required_documents:
            doc_req = ScholarshipDocumentRequirement(
                scholarship_id=scholarship.id,
                document_format_id=req.document_format_id,
                order_index=req.order_index,
                is_mandatory=req.is_mandatory
            )
            db.add(doc_req)
            
    db.commit()
    db.refresh(scholarship)
    
    # Email Notification: Scholarship Updated
    # Notify students who have applied? Or all? 
    # Requirement: "Call notify_scholarship_updated() for affected students"
    from app.models.application import Application
    
    apps = db.query(Application).filter(Application.scholarship_id == scholarship.id).all()
    user_ids = [app.student_id for app in apps]
    users = db.query(User).filter(User.id.in_(user_ids)).all()
    recipients = [u.email for u in users]
    
    try:
        from app.tasks.email_tasks import send_notification_task
        if recipients and scholarship_in.notify_students:
            send_notification_task.delay(
                notification_type="scholarship_updated",
                recipients=recipients,
                data={
                    "scholarship_name": scholarship.name
                }
            )
    except Exception as e:
        logger.error(f"Failed to send email notification: {e}")
    
    return scholarship

@router.delete("/{scholarship_id}")
def delete_scholarship(
    scholarship_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN])),
):
    scholarship = db.query(Scholarship).filter(Scholarship.id == scholarship_id).first()
    if not scholarship:
        raise HTTPException(status_code=404, detail="Scholarship not found")
    
    # Soft delete or hard delete? Let's do soft delete by setting active=False
    scholarship.is_active = False
    db.commit()
    return {"message": "Scholarship deactivated"}

# --- Announcements ---

from app.models.scholarship import Announcement
from datetime import date

@router.post("/announcements", response_model=schemas.AnnouncementResponse)
def create_announcement(
    announcement_in: schemas.AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.GOFFICE])),
) -> Any:
    """
    Create announcement
    """
    announcement = Announcement(
        title=announcement_in.title,
        content=announcement_in.content,
        scholarship_id=announcement_in.scholarship_id,
        date_posted=date.today(),
        is_active=True
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    
    # Email Notification: Notice Published
    # Requirement: "Call notify_new_notice() for all students"
    # Wait, if it's linked to a scholarship, maybe just those students?
    # User said: "When admin or goffice posts a notice -> Call notify_new_notice() for all students"
    # But usually notices are specific. Let's follow requirement: ALL students.
    
    users = db.query(User).filter(User.role == UserRole.STUDENT).all()
    recipients = [u.email for u in users]
    
    try:
        from app.tasks.email_tasks import send_notification_task
        if recipients:
            send_notification_task.delay(
                notification_type="notice_published",
                recipients=recipients,
                data={
                    "title": announcement.title,
                    "content": announcement.content
                }
            )
    except Exception as e:
        logger.error(f"Failed to send email notification: {e}")
        
    return announcement

@router.get("/{scholarship_id}/announcements", response_model=List[schemas.AnnouncementResponse])
def get_scholarship_announcements(
    scholarship_id: int,
    db: Session = Depends(get_db),
) -> Any:
    """
    Get announcements for a scholarship
    """
    return db.query(Announcement).filter(
        Announcement.scholarship_id == scholarship_id,
        Announcement.is_active == True
    ).all()

# --- Applications & Export ---
from app.models.application import Application, ApplicationStatus
from app.models.student import StudentProfile
from fastapi.responses import StreamingResponse
import csv
import io

@router.get("/{scholarship_id}/applications", response_model=List[schemas.ApplicationResponse])
def get_scholarship_applications(
    scholarship_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.GOFFICE])),
) -> Any:
    """
    Get all applications for a specific scholarship
    """
    return db.query(Application).filter(Application.scholarship_id == scholarship_id).all()

@router.get("/{scholarship_id}/export")
def export_scholarship_data(
    scholarship_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.GOFFICE])),
):
    """
    Export scholarship applications as CSV
    """
    scholarship = db.query(Scholarship).filter(Scholarship.id == scholarship_id).first()
    if not scholarship:
        raise HTTPException(status_code=404, detail="Scholarship not found")
        
    applications = db.query(Application).filter(Application.scholarship_id == scholarship_id).all()
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(['Application ID', 'Student ID', 'Student Name', 'Status', 'Applied Date', 'Remarks'])
    
    for app in applications:
        student_name = "N/A"
        if app.student and app.student.full_name:
            student_name = app.student.full_name
            
        writer.writerow([
            app.id,
            app.student_id,
            student_name,
            app.status.value,
            app.created_at.strftime("%Y-%m-%d"),
            app.remarks
        ])
        
    output.seek(0)
    
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=scholarship_{scholarship_id}_export.csv"
    return response
