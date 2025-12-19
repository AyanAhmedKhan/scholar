from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User, UserRole
from app.models.student import StudentDocument, StudentProfile
from app.models.scholarship import DocumentFormat
from app.schemas import schemas
from app.api import deps
from app.core.config import settings
import shutil
import os
import uuid

router = APIRouter()

# --- Document Types (Admin) ---

@router.get("/types", response_model=List[schemas.DocumentFormatResponse])
def get_document_types(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get all document types (Public/Authenticated)
    """
    return db.query(DocumentFormat).filter(DocumentFormat.is_active == True).order_by(DocumentFormat.order_index).offset(skip).limit(limit).all()

@router.post("/types", response_model=schemas.DocumentFormatResponse)
def create_document_type(
    format_in: schemas.DocumentFormatCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.GOFFICE])),
) -> Any:
    """
    Create new document type (Admin/GOffice)
    """
    try:
        fmt = DocumentFormat(**format_in.dict(), is_active=True)
        db.add(fmt)
        db.commit()
        db.refresh(fmt)
        return fmt
    except Exception as e:
        logger.error(f"Error creating document type: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create document type")

@router.delete("/types/{type_id}")
def delete_document_type(
    type_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.GOFFICE])),
):
    fmt = db.query(DocumentFormat).filter(DocumentFormat.id == type_id).first()
    if not fmt:
        raise HTTPException(status_code=404, detail="Document type not found")
    fmt.is_active = False
    db.commit()
    return {"message": "Document type deactivated"}

# --- Student Documents ---

@router.post("/upload", response_model=schemas.StudentDocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form(None), # Optional if format_id provided
    document_format_id: int = Form(None),
    max_pages: int = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Upload a document to vault.
    If document_format_id is provided, it links to that type.
    If same type exists, it deactivates old one (Versioning).
    """
    # Validate File
    # Allow PDF, JPG, PNG
    ALLOWED_MIMES = ["application/pdf", "image/jpeg", "image/png"]
    if file.content_type not in ALLOWED_MIMES:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: PDF, JPG, PNG. Got: {file.content_type}")
        
    page_count = 1 # Default for images
    
    try:
        # Check size
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        
        # Determine metadata (Page Count for PDF)
        if file.content_type == "application/pdf":
            try:
                from pypdf import PdfReader
                reader = PdfReader(file.file)
                page_count = len(reader.pages)
                file.file.seek(0) # Reset after reading
            except Exception as e:
                print(f"Error reading PDF page count: {e}")
                # Don't fail upload, but maybe warn or set to 1? Setting 0 implies unknown
                page_count = 0 
                file.file.seek(0) # Ensure reset
        
        # Validate Page Count
        if max_pages and page_count > max_pages:
            raise HTTPException(status_code=400, detail=f"File exceeds page limit. Maximum allowed pages: {max_pages}, but your file has {page_count} pages.")

        
        max_mb = 5 
        if document_format_id:
            # Validate Format ID exists (Prevention of FK IntegrityError)
            fmt = db.query(DocumentFormat).filter(DocumentFormat.id == document_format_id).first()
            if not fmt:
                raise HTTPException(status_code=400, detail=f"Invalid document_format_id: {document_format_id}")
            if fmt.max_size_mb:
                max_mb = fmt.max_size_mb
        
        if file_size > max_mb * 1024 * 1024:
             raise HTTPException(status_code=400, detail=f"File too large. Your file is {file_size/1024/1024:.2f}MB, but maximum size for this document is {max_mb}MB")

        # Save File
        from app.core.storage import get_storage_path, save_upload_file, delete_file
        
        # Determine document type name for folder structure
        if document_format_id:
            # We already fetched fmt above
            doc_type_name = fmt.name if fmt else (document_type or "uncategorized")
        else:
            doc_type_name = document_type or "uncategorized"
            
        # Get enrollment number
        student_profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
        enrollment_no = student_profile.enrollment_no if student_profile else None
        
        # Clean enrollment number for path safety if present
        if enrollment_no:
            enrollment_no = "".join(c for c in enrollment_no if c.isalnum() or c in ('-', '_')).strip()

        destination_dir = get_storage_path(
            category="vault", 
            student_id=current_user.id,
            enrollment_no=enrollment_no,
            document_type=doc_type_name
        )
        
        # Ensure we pass the original filename extension correctly if needed, simpler to rely on file.filename 
        saved_path = save_upload_file(file, destination_dir)
            
        files_to_delete = []

        # Handle Versioning
        if document_format_id:
            # Deactivate old docs of same format
            old_docs = db.query(StudentDocument).filter(
                StudentDocument.student_id == current_user.id,
                StudentDocument.document_format_id == document_format_id,
                StudentDocument.is_active == True
            ).all()
            for doc in old_docs:
                doc.is_active = False
                files_to_delete.append(doc.file_path)
        else:
            # Fallback to string type versioning
            old_docs = db.query(StudentDocument).filter(
                StudentDocument.student_id == current_user.id,
                StudentDocument.document_type == document_type,
                StudentDocument.is_active == True
            ).all()
            for doc in old_docs:
                doc.is_active = False
                files_to_delete.append(doc.file_path)

        # Create DB Entry
        db_doc = StudentDocument(
            student_id=current_user.id,
            document_type=doc_type_name,
            document_format_id=document_format_id,
            file_path=saved_path,
            is_active=True,
            mime_type=file.content_type,
            page_count=page_count
        )

        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)
        
        # Safe to delete physical files now that DB is consistent
        for f_path in files_to_delete:
            delete_file(f_path)
            
        return db_doc
        
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc() # Print to backend console
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Upload processing failed: {str(e)}")

@router.get("/", response_model=List[schemas.StudentDocumentResponse])
def get_my_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user's active documents
    """
    return db.query(StudentDocument).filter(
        StudentDocument.student_id == current_user.id,
        StudentDocument.is_active == True
    ).all()
