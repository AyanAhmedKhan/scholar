from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.database import get_db
from app.models.user import User, UserRole
from app.models.scholarship import Scholarship
from app.models.application import Application, ApplicationStatus
from app.models.student import StudentProfile, StudentDocument
from app.models.application import ApplicationDocument
from app.models.scholarship import DocumentFormat
from app.schemas import schemas
from app.api import deps
import json
import logging
import os
import mimetypes

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/apply", response_model=schemas.ApplicationResponse)
def apply_for_scholarship(
    application_in: schemas.ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Apply for a scholarship (Fresh Application)
    """
    # Check if scholarship exists
    scholarship = db.query(Scholarship).filter(Scholarship.id == application_in.scholarship_id).first()
    if not scholarship:
        raise HTTPException(status_code=404, detail="Scholarship not found")
        
    # Check if already applied
    existing_app = db.query(Application).filter(
        Application.student_id == current_user.id,
        Application.scholarship_id == application_in.scholarship_id
    ).first()
    if existing_app:
        raise HTTPException(status_code=400, detail="Already applied for this scholarship")

    # Check Mutual Exclusion
    user_apps = db.query(Application).filter(
        Application.student_id == current_user.id,
        Application.status != ApplicationStatus.REJECTED
    ).all()
    
    applied_scholarship_ids = [app.scholarship_id for app in user_apps]
    
    if scholarship.mutually_exclusive_ids:
        excluded_ids = scholarship.mutually_exclusive_ids
        for app_id in applied_scholarship_ids:
            if app_id in excluded_ids:
                 raise HTTPException(status_code=400, detail="Cannot apply due to mutual exclusion rules")

    # Create Application
    application = Application(
        student_id=current_user.id,
        scholarship_id=application_in.scholarship_id,
        status=ApplicationStatus.SUBMITTED, # Direct to submitted for now
        remarks=application_in.remarks
    )
    db.add(application)
    db.flush() # Get ID
    
    from app.core.audit_logger import log_action
    log_action(
        db, 
        action="SUBMIT_APPLICATION", 
        user_id=current_user.id, 
        target_type="Application", 
        target_id=str(application.id), 
        details={"scholarship_id": application_in.scholarship_id}
    )

    # Email Notification
    try:
        from app.tasks.email_tasks import send_notification_task
        student_profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
        if student_profile:
            send_notification_task.delay(
                notification_type="application_submitted",
                recipients=[current_user.email],
                data={
                    "student_name": current_user.full_name,
                    "scholarship_name": scholarship.name,
                    "application_id": application.id
                }
            )
    except Exception as e:
        logger.error(f"Failed to send email notification: {e}")

    # Validating and Linking Documents from Vault
    # 1. Fetch Student's Active Documents
    student_docs = db.query(StudentDocument).filter(
        StudentDocument.student_id == current_user.id,
        StudentDocument.is_active == True
    ).all()
    
    # 2. Get Requirements
    requirements = scholarship.required_documents
    
    # 3. Validation Logic
    missing_docs = []
    
    for req in requirements:
        if req.is_mandatory:
            # Find matching document
            match = next((d for d in student_docs if d.document_format_id == req.document_format_id), None)
            
            if not match:
                missing_docs.append(f"{req.document_format.name} (Missing)")
                continue

            # Check MIME Type
            # allowed_types is list like ["pdf", "jpg", "png"]
            # stored mime_type is "application/pdf", "image/jpeg"
            file_ext_map = {
                "application/pdf": "pdf",
                "image/jpeg": "jpg",
                "image/png": "png"
            }
            
            doc_ext = file_ext_map.get(match.mime_type, "unknown")
            # Normalize allowed types to lowercase just in case
            allowed = [t.lower() for t in (req.allowed_types or ["pdf"])]
            
            # Special case: allow 'jpg' to match 'jpeg'
            if doc_ext == "jpg" and "jpeg" in allowed: pass 
            elif doc_ext not in allowed:
                # If "jpg" is allowed, allow "image/jpeg"
                # Simple check:
                is_valid_type = False
                for t in allowed:
                    if t in ["jpg", "jpeg"] and match.mime_type == "image/jpeg": is_valid_type = True
                    if t == "png" and match.mime_type == "image/png": is_valid_type = True
                    if t == "pdf" and match.mime_type == "application/pdf": is_valid_type = True
                
                if not is_valid_type:
                     missing_docs.append(f"{req.document_format.name} (Invalid Type: {doc_ext}, Allowed: {', '.join(allowed)})")
                     continue

            # Check Page Count (Only for PDF and if limit set)
            if match.mime_type == "application/pdf" and req.max_pages:
                 if (match.page_count or 0) > req.max_pages:
                     missing_docs.append(f"{req.document_format.name} (Too many pages: {match.page_count}, Max: {req.max_pages})")
                     continue

    if missing_docs:
        raise HTTPException(status_code=400, detail=f"Document Validation Failed: {'; '.join(missing_docs)}")

    from app.core.storage import get_storage_path, copy_file
    
    # Link documents that match requirements
    # Also link any other documents that the student has but aren't strictly required? 
    # Current logic links ALL valid docs. Let's stick to linking VALIDATED docs for the requirements + others if needed.
    # For now, simplistic approach: Link ALL vault docs that *could* belong here? 
    # Or strict: Only link what's required + optional?
    # Let's iterate user docs and link them if they match a format required (even if optional)
    
    linked_count = 0 
    
    for doc in student_docs:
        # Check if this doc format is part of scholarship requirements
        req = next((r for r in requirements if r.document_format_id == doc.document_format_id), None)
        
        # If strict, only link relevant docs
        if not req:
            continue 
            
        # Re-verify (validation passed above, but good for safety)
        # Find or create a format based on doc type name
        fmt = req.document_format if req else None
        if not fmt:
             # Should be fetched via ORM
             fmt = db.query(DocumentFormat).filter(DocumentFormat.id == doc.document_format_id).first()

        # Get enrollment number
        student_profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
        enrollment_no = student_profile.enrollment_no if student_profile else None
        
        if enrollment_no:
            enrollment_no = "".join(c for c in enrollment_no if c.isalnum() or c in ('-', '_')).strip()

        # Determine destination for application snapshot
        dest_dir = get_storage_path(
            category="application",
            student_id=current_user.id,
            enrollment_no=enrollment_no,
            scholarship_id=application.scholarship_id,
            application_id=application.id
        )
        
        # Copy file from Vault to Application folder
        try:
            new_path = copy_file(doc.file_path, dest_dir)
        except FileNotFoundError as e:
            logger.error(f"File missing for doc {doc.id}: {doc.file_path} - {e}")
            continue
            
        app_doc = ApplicationDocument(
            application_id=application.id,
            document_format_id=doc.document_format_id,
            file_path=new_path,
            is_verified=False 
        )
        db.add(app_doc)
        linked_count += 1
    
    
    # Commit all document links
    db.commit()
    db.refresh(application)
    
    return application

class ApplicationUpdate(BaseModel):
    remarks: Optional[str] = None

@router.put("/{application_id}", response_model=schemas.ApplicationResponse)
def update_application(
    application_id: int,
    application_in: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update/Resubmit an application (Correction)
    Only allowed if status is DOCS_REQUIRED or DRAFT
    """
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
        
    if application.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if application.status not in [ApplicationStatus.DOCS_REQUIRED, ApplicationStatus.DRAFT]:
        raise HTTPException(status_code=400, detail="Application cannot be updated in current status")
        
    # Update Status and Remarks
    application.status = ApplicationStatus.SUBMITTED
    application.remarks = application_in.remarks # Student's new remarks
    
    # Re-link documents
    student_docs = db.query(StudentDocument).filter(
        StudentDocument.student_id == current_user.id,
        StudentDocument.is_active == True
    ).all()
    
    from app.core.storage import get_storage_path, copy_file, delete_file
    
    for doc in student_docs:
        # Find or create a format based on doc type
        fmt = db.query(DocumentFormat).filter(DocumentFormat.name == doc.document_type).first()
        if not fmt:
            continue
            
        # Check if already linked
        app_doc = db.query(ApplicationDocument).filter(
            ApplicationDocument.application_id == application.id,
            ApplicationDocument.document_format_id == fmt.id
        ).first()
        
        # Get enrollment number
        student_profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
        enrollment_no = student_profile.enrollment_no if student_profile else None
        if enrollment_no:
            enrollment_no = "".join(c for c in enrollment_no if c.isalnum() or c in ('-', '_')).strip()

        dest_dir = get_storage_path(
            category="application",
            student_id=current_user.id,
            enrollment_no=enrollment_no,
            scholarship_id=application.scholarship_id,
            application_id=application.id
        )
        
        try:
            new_path = copy_file(doc.file_path, dest_dir)
            
            if app_doc:
                # Update existing
                # DELETE OLD FILE to save space
                if app_doc.file_path:
                    delete_file(app_doc.file_path)
                    
                app_doc.file_path = new_path
                app_doc.is_verified = False # Reset verification
            else:
                # Create new
                app_doc = ApplicationDocument(
                    application_id=application.id,
                    document_format_id=fmt.id,
                    file_path=new_path,
                    is_verified=False
                )
                db.add(app_doc)
                
        except FileNotFoundError as e:
            logger.error(f"File missing during update for doc {doc.id}: {e}")
            continue

    db.commit()
    db.refresh(application)
    
    # Audit
    from app.core.audit_logger import log_action
    log_action(
        db, 
        action="UPDATE_APPLICATION", 
        user_id=current_user.id, 
        target_type="Application", 
        target_id=str(application.id),
        details={"status": "SUBMITTED"}
    )
    
    return application

@router.get("/", response_model=List[schemas.ApplicationResponse])
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user's applications
    """
    return db.query(Application).filter(Application.student_id == current_user.id).all()

from app.tasks.pdf_tasks import merge_pdfs_task
from fastapi.responses import Response
import base64

@router.get("/renewable")
def get_renewable_scholarships(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Get scholarships that the current user can renew
    """
    # Get user's approved applications
    approved_apps = db.query(Application).filter(
        Application.student_id == current_user.id,
        Application.status == ApplicationStatus.APPROVED
    ).all()
    
    renewable_scholarships_dict = {}
    for app in approved_apps:
        if app.scholarship_id not in renewable_scholarships_dict:
            scholarship = db.query(Scholarship).filter(Scholarship.id == app.scholarship_id).first()
            if scholarship and scholarship.is_renewable:
                # Check if user's batch can renew (based on batch if configured)
                # For now, if scholarship is renewable, allow renewal
                # TODO: Add batch checking when student profile has batch/session info
                renewable_scholarships_dict[app.scholarship_id] = scholarship
    
    return list(renewable_scholarships_dict.values())

class RenewalCreate(BaseModel):
    scholarship_id: int
    remarks: Optional[str] = None
    is_draft: bool = False

@router.post("/renew", response_model=schemas.ApplicationResponse)
def renew_scholarship(
    renewal_in: RenewalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Renew a previously approved scholarship application
    """
    # Check if scholarship exists and is renewable
    scholarship = db.query(Scholarship).filter(Scholarship.id == renewal_in.scholarship_id).first()
    if not scholarship:
        raise HTTPException(status_code=404, detail="Scholarship not found")
    
    if not scholarship.is_renewable:
        raise HTTPException(status_code=400, detail="This scholarship does not support renewal")
    
    # Check if user has an approved application for this scholarship
    previous_app = db.query(Application).filter(
        Application.student_id == current_user.id,
        Application.scholarship_id == renewal_in.scholarship_id,
        Application.status == ApplicationStatus.APPROVED
    ).order_by(Application.created_at.desc()).first()
    
    if not previous_app:
        raise HTTPException(
            status_code=400, 
            detail="You must have an approved application to renew this scholarship"
        )
    
    # Check if already has a pending renewal
    pending_renewal = db.query(Application).filter(
        Application.student_id == current_user.id,
        Application.scholarship_id == renewal_in.scholarship_id,
        Application.status.in_([ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_VERIFICATION, ApplicationStatus.DOCS_REQUIRED])
    ).first()
    
    if pending_renewal:
        raise HTTPException(
            status_code=400,
            detail="You already have a pending renewal application for this scholarship"
        )
    
    # Get renewal-required documents
    renewal_docs = [req for req in scholarship.required_documents if req.is_renewal_required]
    
    # Check if student has uploaded renewal documents
    student_docs = db.query(StudentDocument).filter(
        StudentDocument.student_id == current_user.id,
        StudentDocument.is_active == True
    ).all()
    
    # Verify renewal documents are present
    missing_docs = []
    for req in renewal_docs:
        if req.is_mandatory:
            has_doc = any(doc.document_format_id == req.document_format_id for doc in student_docs)
            if not has_doc:
                # Get document format name
                doc_format = db.query(DocumentFormat).filter(DocumentFormat.id == req.document_format_id).first()
                missing_docs.append(doc_format.name if doc_format else f"Document #{req.document_format_id}")
    
    if missing_docs and not renewal_in.is_draft:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required renewal documents: {', '.join(missing_docs)}"
        )
    
    # Create renewal application
    application = Application(
        student_id=current_user.id,
        scholarship_id=renewal_in.scholarship_id,
        status=ApplicationStatus.DRAFT if renewal_in.is_draft else ApplicationStatus.SUBMITTED,
        remarks=renewal_in.remarks
    )
    db.add(application)
    db.flush()
    
    # Link renewal documents from vault
    from app.core.storage import get_storage_path, copy_file
    
    for req in renewal_docs:
        # Find student document for this requirement
        student_doc = next((d for d in student_docs if d.document_format_id == req.document_format_id), None)
        if student_doc:
            # Get enrollment number
            student_profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
            enrollment_no = student_profile.enrollment_no if student_profile else None
            if enrollment_no:
                enrollment_no = "".join(c for c in enrollment_no if c.isalnum() or c in ('-', '_')).strip()

            dest_dir = get_storage_path(
                category="application",
                student_id=current_user.id,
                enrollment_no=enrollment_no,
                scholarship_id=application.scholarship_id,
                application_id=application.id
            )
            
            try:
                new_path = copy_file(student_doc.file_path, dest_dir)
                app_doc = ApplicationDocument(
                    application_id=application.id,
                    document_format_id=req.document_format_id,
                    file_path=new_path,
                    is_verified=False
                )
                db.add(app_doc)
            except FileNotFoundError as e:
                logger.error(f"File missing for renewal doc {student_doc.id}: {e}")
    
    # Also link non-renewal documents from previous application
    if previous_app and previous_app.documents:
        for prev_doc in previous_app.documents:
            # Only link if not a renewal-required document
            is_renewal_doc = any(req.document_format_id == prev_doc.document_format_id for req in renewal_docs)
            if not is_renewal_doc:
                # Get enrollment number
                student_profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
                enrollment_no = student_profile.enrollment_no if student_profile else None
                if enrollment_no:
                    enrollment_no = "".join(c for c in enrollment_no if c.isalnum() or c in ('-', '_')).strip()

                dest_dir = get_storage_path(
                    category="application",
                    student_id=current_user.id,
                    enrollment_no=enrollment_no,
                    scholarship_id=application.scholarship_id,
                    application_id=application.id
                )
                try:
                    new_path = copy_file(prev_doc.file_path, dest_dir)
                    app_doc = ApplicationDocument(
                        application_id=application.id,
                        document_format_id=prev_doc.document_format_id,
                        file_path=new_path,
                        is_verified=False
                    )
                    db.add(app_doc)
                except FileNotFoundError as e:
                    logger.error(f"File missing for previous doc {prev_doc.id}: {e}")
    
    db.commit()
    db.refresh(application)
    
    # Log action
    from app.core.audit_logger import log_action
    log_action(
        db,
        action="SUBMIT_RENEWAL" if not renewal_in.is_draft else "SAVE_RENEWAL_DRAFT",
        user_id=current_user.id,
        target_type="Application",
        target_id=str(application.id),
        details={"scholarship_id": renewal_in.scholarship_id, "previous_app_id": previous_app.id}
    )
    
    # Email notification
    try:
        from app.tasks.email_tasks import send_notification_task
        send_notification_task.delay(
            notification_type="renewal_submitted" if not renewal_in.is_draft else "renewal_draft_saved",
            recipients=[current_user.email],
            data={
                "student_name": current_user.full_name,
                "scholarship_name": scholarship.name,
                "application_id": application.id
            }
        )
    except Exception as e:
        logger.error(f"Failed to send email notification: {e}")
    
    return application

@router.get("/{application_id}/pdf")
def get_application_pdf(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user), # Or admin
):
    """
    Generate and download merged PDF for application
    """
    try:
        application = db.query(Application).filter(Application.id == application_id).first()
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
            
        # Check permissions (Owner or Admin/Staff)
        if current_user.role == UserRole.STUDENT and application.student_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
            
        # Get document paths (sorted by format order)
        docs = application.documents
        logger.info(f"Application {application_id} has {len(docs) if docs else 0} documents")
        
        if not docs:
            logger.warning(f"Application {application_id} has no documents linked. Returning 400.")
            raise HTTPException(status_code=400, detail="No documents uploaded for this application. Please upload required documents first.")
        
        file_paths = [doc.file_path for doc in docs if doc.file_path]
        logger.info(f"Valid file paths: {file_paths}")
        
        if not file_paths:
            logger.warning(f"Application {application_id} has documents but no valid file paths. Returning 400.")
            raise HTTPException(status_code=400, detail="No valid document paths found. Please check your uploaded documents.")
            
        # Trigger Celery Task
        logger.info(f"Triggering PDF merge task for {len(file_paths)} files")
        task = merge_pdfs_task.delay(file_paths)
        logger.info(f"Task ID: {task.id}")
        
        # Wait for result (in production, might want to poll or use websockets for very large files)
        try:
            pdf_content = task.get(timeout=60) # Increased to 60 seconds
            logger.info(f"PDF generated successfully, size: {len(pdf_content) if pdf_content else 0} bytes")
        except Exception as e:
            logger.error(f"PDF merge task failed: {str(e)}", exc_info=True)
            # Re-raise to trigger fallback in outer except block
            raise e
             
        if not pdf_content:
            logger.error("PDF merge task returned empty content")
            raise Exception("PDF generation returned empty content")
            
        if isinstance(pdf_content, str) and len(pdf_content) < 500: # Likely an error message
            logger.error(f"PDF merge returned error: {pdf_content}")
            raise Exception(f"PDF generation failed: {pdf_content}")

        return Response(content=pdf_content, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=application_{application_id}.pdf"})
    
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Celery task failed/timed out, attempting synchronous generation: {e}")
        try:
            # Fallback: Run synchronously
            # We call the function directly (not .delay)
            # Note: merge_pdfs_task is decorated with @shared_task, so calling it directly works in recent Celery versions
            # but usually it's better to extract the logic. 
            # However, for this fix, we will try direct call or rely on "always eager" config if possible.
            # Let's try direct call since @shared_task usually preserves the original function as .run() or just callable.
            # Safe bet: call the logic directly. Use .run if available or just the function.
            # Calling a celery task object directly acts as applying it locally.
            pdf_content = merge_pdfs_task(file_paths)
            
            if isinstance(pdf_content, str) and pdf_content.startswith("Error"):
                 raise Exception(pdf_content)
                 
            return Response(content=pdf_content, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=application_{application_id}.pdf"})
        except Exception as sync_e:
            logger.error(f"Synchronous PDF generation also failed: {sync_e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error generating PDF (Sync): {str(sync_e)}")

@router.get("/documents/{doc_id}/preview")
def preview_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Securely stream document content for preview.
    Hides the actual file path from the user.
    """
    # 1. Fetch Document
    doc = db.query(ApplicationDocument).filter(ApplicationDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # 2. Check Permissions (Ownership or Admin/Staff)
    application = db.query(Application).filter(Application.id == doc.application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Associated application not found")

    is_owner = (application.student_id == current_user.id)
    # Correct roles based on user.py
    is_staff = (current_user.role in [UserRole.ADMIN, UserRole.GOFFICE, UserRole.DEPT_HEAD])
    
    if not (is_owner or is_staff):
        raise HTTPException(status_code=403, detail="Not authorized to view this document")

    # 3. Check File Existence
    logger.info(f"Checking file for Doc ID {doc_id}: Path='{doc.file_path}'")
    if not doc.file_path or not os.path.exists(doc.file_path):
        logger.error(f"File NOT found at path: '{doc.file_path}' (CWD: {os.getcwd()})")
        raise HTTPException(status_code=404, detail=f"File content not found on server. Path: {doc.file_path}")

    # 4. Determine Media Type
    import mimetypes
    media_type, _ = mimetypes.guess_type(doc.file_path)
    if not media_type:
        media_type = "application/octet-stream"

    # 5. Return File Stream (generic filename to hide structure)
    from fastapi.responses import FileResponse
    return FileResponse(
        doc.file_path, 
        media_type=media_type, 
        filename=f"document_{doc_id}_{doc.document_format_id}.{media_type.split('/')[-1]}",
        content_disposition_type="inline" # Important for previewing in browser/iframe
    )

@router.post("/switch-scholarship")
def switch_scholarship(
    switch_in: schemas.SwitchScholarshipRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Switch from a conflicting scholarship to a new one.
    Allowed only ONCE per student.
    Deletes the conflicting application to allow applying to the new one.
    """
    # 1. Get Student Profile
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")
        
    # 2. Check Switch Count Limit
    if (profile.scholarship_switch_count or 0) >= 1:
        raise HTTPException(status_code=400, detail="You have already used your one-time switch allowance.")
        
    # 3. Validation: Check Target Scholarship
    target_scholarship = db.query(Scholarship).filter(Scholarship.id == switch_in.target_scholarship_id).first()
    if not target_scholarship:
        raise HTTPException(status_code=404, detail="Target scholarship not found")
        
    # 4. Find Conflicting Application
    # We need to find which application conflicts with the target
    user_apps = db.query(Application).filter(
        Application.student_id == current_user.id,
        Application.status != ApplicationStatus.REJECTED
    ).all()
    
    conflicting_app = None
    if target_scholarship.mutually_exclusive_ids:
        for app in user_apps:
            if app.scholarship_id in target_scholarship.mutually_exclusive_ids:
                conflicting_app = app
                break
    
    if not conflicting_app:
        raise HTTPException(status_code=400, detail="No conflicting application found to switch from.")
        
    # 5. Execute Switch (Delete old app, increment count)
    try:
        # Delete documents associated with the app explicitly to ensure no integrity error
        # Use synchronize_session=False to avoid session issues
        db.query(ApplicationDocument).filter(ApplicationDocument.application_id == conflicting_app.id).delete(synchronize_session=False)
        
        # Delete the application record via query to bypass complex ORM cascade checks
        db.query(Application).filter(Application.id == conflicting_app.id).delete(synchronize_session=False)
        
        # Increment count
        profile.scholarship_switch_count = (profile.scholarship_switch_count or 0) + 1
        
        db.commit()
        
        # Log action
        from app.core.audit_logger import log_action
        log_action(
            db,
            action="SWITCH_SCHOLARSHIP",
            user_id=current_user.id,
            target_type="Scholarship",
            target_id=str(switch_in.target_scholarship_id),
            details={
                "deleted_application_id": conflicting_app.id,
                "deleted_scholarship_id": conflicting_app.scholarship_id,
                "switch_count": profile.scholarship_switch_count
            }
        )
        
        return {"message": "Successfully switched. You can now apply for the new scholarship."}
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to switch scholarship: {e}")
        raise HTTPException(status_code=500, detail="Failed to process scholarship switch")
