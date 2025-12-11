from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.models.student import StudentProfile
from app.schemas import schemas
from app.api import deps
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/me", response_model=schemas.StudentProfileResponse)
def read_user_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user profile
    """
    # Query profile explicitly instead of using relationship to avoid lazy loading issues
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.post("/", response_model=schemas.StudentProfileResponse)
def create_user_profile(
    profile_in: schemas.StudentProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create user profile
    """
    # Check if profile already exists for this user
    existing_profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if existing_profile:
        raise HTTPException(status_code=400, detail="Profile already exists for this user")

    # Check if enrollment number is already used by another user
    if profile_in.enrollment_no:
        existing_enrollment = db.query(StudentProfile).filter(StudentProfile.enrollment_no == profile_in.enrollment_no).first()
        if existing_enrollment:
             raise HTTPException(status_code=400, detail="Enrollment number already registered")
    
    try:
        # Filter out None values to avoid setting NULL explicitly where not needed
        profile_data = {k: v for k, v in profile_in.dict().items() if v is not None}
        
        profile = StudentProfile(
            user_id=current_user.id,
            **profile_data
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        logger.info(f"Profile created for user {current_user.id}")
        return profile
    except Exception as e:
        logger.error(f"Error creating profile for user {current_user.id}: {e}", exc_info=True)
        db.rollback()
        # Check for integrity error in string if specific exception catching is hard without import
        if "Duplicate entry" in str(e):
             raise HTTPException(status_code=400, detail="Duplicate data entry (e.g., enrollment number or email)")
        raise HTTPException(status_code=500, detail=f"Failed to create profile: {str(e)}")

@router.put("/me", response_model=schemas.StudentProfileResponse)
def update_user_profile(
    profile_in: schemas.StudentProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update user profile
    """
    # Query profile explicitly instead of using relationship to avoid lazy loading issues
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    try:
        for field, value in profile_in.dict(exclude_unset=True).items():
            setattr(profile, field, value)
        
        db.add(profile)
        db.commit()
        db.refresh(profile)
        logger.info(f"Profile updated for user {current_user.id}")
        return profile
    except Exception as e:
        logger.error(f"Error updating profile for user {current_user.id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update profile")
