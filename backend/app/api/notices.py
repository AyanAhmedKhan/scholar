from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.notice import Notice
from app.models.user import User, UserRole
from app.schemas import schemas
from app.api import deps

router = APIRouter()

@router.get("/public", response_model=List[schemas.NoticeResponse])
def read_public_notices(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get public active notices
    """
    notices = db.query(Notice).filter(Notice.is_active == True).order_by(Notice.created_at.desc()).offset(skip).limit(limit).all()
    return notices

@router.post("/", response_model=schemas.NoticeResponse)
def create_notice(
    notice_in: schemas.NoticeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.GOFFICE])),
) -> Any:
    """
    Create a new notice (GOffice/Admin)
    """
    notice = Notice(
        title=notice_in.title,
        content=notice_in.content,
        created_by=current_user.id,
        is_active=notice_in.is_active
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)
    return notice

@router.delete("/{notice_id}", response_model=dict)
def delete_notice(
    notice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.GOFFICE])),
) -> Any:
    """
    Delete a notice
    """
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    
    db.delete(notice)
    db.commit()
    return {"message": "Notice deleted successfully"}
