from typing import Any
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests
from app.db.database import get_db
from app.models.user import User, UserRole
from app.models.student import StudentProfile
from app.core import security
from app.core.config import settings
from app.api import deps
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class Token(BaseModel):
    access_token: str
    token_type: str

class GoogleLoginRequest(BaseModel):
    token: str # Google ID Token

@router.post("/login/access-token", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, role=user.role.value, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

def extract_enrollment_from_email(email: str) -> str:
    """
    Extract enrollment number from email.
    For emails like '23io10ay11@mitsgwl.ac.in', extract '23io10ay11'
    For emails like '0901io231011@mitsgwl.ac.in', extract '0901IO231011'
    """
    if not email:
        return ""
    # Extract the part before @
    enrollment = email.split("@")[0]
    return enrollment.upper()  # Convert to uppercase for consistency

def extract_enrollment_and_name_from_formatted(formatted_name: str) -> tuple:
    """
    Extract enrollment number and actual name from formatted name.
    Examples:
    - "0901IO231011 AYAN AHMED KHAN" -> ("0901IO231011", "AYAN AHMED KHAN")
    - "23IO10AY11 Student Name" -> ("23IO10AY11", "Student Name")
    - "AYAN AHMED KHAN" -> ("", "AYAN AHMED KHAN")
    
    Returns tuple of (enrollment_no, actual_name)
    """
    if not formatted_name:
        return "", ""
    
    formatted_name = formatted_name.strip()
    parts = formatted_name.split(None, 1)  # Split on first whitespace
    
    if len(parts) < 2:
        # No space found, it's all one part
        return "", formatted_name
    
    first_part = parts[0]
    rest = parts[1] if len(parts) > 1 else ""
    
    # Check if first part looks like an enrollment number
    # Enrollment numbers typically contain both letters and digits
    has_digit = any(c.isdigit() for c in first_part)
    has_letter = any(c.isalpha() for c in first_part)
    
    if has_digit and has_letter and len(first_part) >= 8:
        # Likely an enrollment number
        return first_part.upper(), rest.strip()
    
    # Not an enrollment format, return original name with no enrollment
    return "", formatted_name

def extract_actual_name_from_formatted(formatted_name: str, enrollment_no: str) -> str:
    """
    Extract actual name from formatted name (if it contains enrollment).
    If name is "0901IO231011 AYAN AHMED KHAN", return "AYAN AHMED KHAN"
    """
    if not formatted_name:
        return ""
    if not enrollment_no:
        return formatted_name.strip()
    # Remove enrollment prefix if present
    enrollment_no = enrollment_no.strip().upper()
    formatted_name = formatted_name.strip()
    if formatted_name.upper().startswith(enrollment_no):
        # Remove enrollment and any leading/trailing spaces
        actual_name = formatted_name[len(enrollment_no):].strip()
        return actual_name if actual_name else formatted_name
    return formatted_name

@router.post("/login/google", response_model=Token)
def login_google(
    payload: GoogleLoginRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Login with Google ID Token. Creates user if not exists.
    Automatically extracts enrollment number from email and name format.
    Auto-creates student profile with enrollment number.
    """
    try:
        idinfo = id_token.verify_oauth2_token(
            payload.token, requests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except ValueError as e:
        logger.error(f"Google Token Verification Failed: {str(e)}")
        # Log the received token and expected client ID for debugging (be careful with logs in prod)
        # logger.error(f"Expected Client ID: {settings.GOOGLE_CLIENT_ID}")
        raise HTTPException(status_code=400, detail=f"Invalid Google Token: {str(e)}")

    email = idinfo.get("email")
    google_id = idinfo.get("sub")
    name = idinfo.get("name") or ""
    
    if not email:
         raise HTTPException(status_code=400, detail="Email not found in token")

    # Extract enrollment number from name format ONLY (e.g., "0901IO231011 AYAN AHMED KHAN")
    # This is the primary and only source for enrollment number
    enrollment_no = ""
    actual_name = name
    if name:
        enrollment_no, extracted_name = extract_enrollment_and_name_from_formatted(name)
        actual_name = extracted_name or name

    user = db.query(User).filter(User.email == email).first()
    is_new_user = False
    
    if not user:
        # Create new student user
        is_new_user = True
        user = User(
            email=email,
            full_name=actual_name,  # Store only actual name, not enrollment + name
            google_id=google_id,
            role=UserRole.STUDENT,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update existing user
        if not user.google_id:
            user.google_id = google_id
        # Update name to actual name only (remove enrollment if present)
        if enrollment_no and user.role == UserRole.STUDENT:
            # Extract actual name from current full_name if it contains enrollment
            current_actual_name = extract_actual_name_from_formatted(user.full_name or "", enrollment_no)
            if current_actual_name and current_actual_name != user.full_name:
                user.full_name = current_actual_name
            elif actual_name and actual_name != user.full_name:
                user.full_name = actual_name
        db.commit()
        db.refresh(user)

    # Auto-create student profile if it doesn't exist and enrollment is available from name
    if enrollment_no and user.role == UserRole.STUDENT:
        try:
            profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
            if not profile:
                try:
                    profile = StudentProfile(
                        user_id=user.id,
                        enrollment_no=enrollment_no
                    )
                    db.add(profile)
                    db.commit()
                    db.refresh(profile)
                    logger.info(f"Auto-created student profile for user {user.id} with enrollment {enrollment_no}")
                except Exception as e:
                    logger.error(f"Failed to auto-create profile for user {user.id}: {e}", exc_info=True)
                    db.rollback()
            elif enrollment_no and not profile.enrollment_no:
                # Update enrollment if profile exists but enrollment is missing
                try:
                    profile.enrollment_no = enrollment_no
                    db.commit()
                    logger.info(f"Updated enrollment number for user {user.id}: {enrollment_no}")
                except Exception as e:
                    logger.error(f"Failed to update enrollment for user {user.id}: {e}", exc_info=True)
                    db.rollback()
        except Exception as e:
            # Log but don't fail the login if profile creation fails
            logger.error(f"Error checking/creating profile for user {user.id}: {e}", exc_info=True)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, role=user.role.value, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.get("/me")
def get_current_user_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user information (name, email, enrollment)
    """
    # Get enrollment from profile if exists
    enrollment_no = None
    is_profile_complete = False
    
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if profile:
        enrollment_no = profile.enrollment_no
        
        # Check completeness based on mandatory fields
        # Mandatory: Session, Dept, Mobile, DOB, Gender, Father, Mother, Category, Income
        mandatory_fields = [
            profile.current_year_or_semester,
            profile.department,
            profile.branch,
            profile.mobile_number,
            profile.date_of_birth,
            profile.gender,
            profile.father_name,
            profile.mother_name,
            profile.category,
            profile.annual_family_income
        ]
        is_profile_complete = all(field is not None and field != "" for field in mandatory_fields)

    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value,
        "enrollment_no": enrollment_no,
        "is_profile_complete": is_profile_complete
    }
