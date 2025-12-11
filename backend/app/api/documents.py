from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User, UserRole
from app.models.student import StudentDocument
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
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Upload a document to vault.
    If document_format_id is provided, it links to that type.
    If same type exists, it deactivates old one (Versioning).
    """
    # Validate File
    # In real app, check file.content_type and size against DocumentFormat if format_id provided
    
    # Save File
    from app.core.storage import get_storage_path, save_upload_file
    
    # Determine document type name for folder structure
    if document_format_id:
        fmt = db.query(DocumentFormat).filter(DocumentFormat.id == document_format_id).first()
        doc_type_name = fmt.name if fmt else (document_type or "uncategorized")
    else:
        doc_type_name = document_type or "uncategorized"

    destination_dir = get_storage_path(
        category="vault", 
        student_id=current_user.id, 
        document_type=doc_type_name
    )
    
    saved_path = save_upload_file(file, destination_dir)
        
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
    else:
        # Fallback to string type versioning
        old_docs = db.query(StudentDocument).filter(
            StudentDocument.student_id == current_user.id,
            StudentDocument.document_type == document_type,
            StudentDocument.is_active == True
        ).all()
        for doc in old_docs:
            doc.is_active = False

    # Create DB Entry
    db_doc = StudentDocument(
        student_id=current_user.id,
        document_type=doc_type_name,
        document_format_id=document_format_id,
        file_path=saved_path,
        is_active=True
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc

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
