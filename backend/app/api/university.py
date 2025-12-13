from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User, UserRole
from app.models.university import Department, SessionYear, Branch
from app.schemas import schemas
from app.api import deps

router = APIRouter()

# --- Departments ---

@router.get("/departments", response_model=List[schemas.DepartmentResponse])
def get_departments(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get all active departments (Public/Authenticated)
    """
    return db.query(Department).filter(Department.is_active == True).offset(skip).limit(limit).all()

@router.post("/departments", response_model=schemas.DepartmentResponse)
def create_department(
    dept_in: schemas.DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN])),
) -> Any:
    """
    Create department (Admin only)
    """
    dept = Department(name=dept_in.name, code=dept_in.code)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

# --- Session Years ---

@router.get("/sessions", response_model=List[schemas.SessionYearResponse])
def get_sessions(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get all active session years (Public/Authenticated)
    """
    return db.query(SessionYear).filter(SessionYear.is_active == True).offset(skip).limit(limit).all()

@router.post("/sessions", response_model=schemas.SessionYearResponse)
def create_session(
    session_in: schemas.SessionYearCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN])),
) -> Any:
    """
    Create session year (Admin only)
    """
    session = SessionYear(name=session_in.name)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

# --- Branches ---

@router.get("/branches", response_model=List[schemas.BranchResponse])
def get_branches(
    department_id: int = None,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get branches, optionally filtered by department_id
    """
    query = db.query(Branch).filter(Branch.is_active == True)
    if department_id:
        query = query.filter(Branch.department_id == department_id)
    return query.offset(skip).limit(limit).all()

@router.post("/branches", response_model=schemas.BranchResponse)
def create_branch(
    branch_in: schemas.BranchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN])),
) -> Any:
    """
    Create branch (Admin only)
    """
    branch = Branch(
        name=branch_in.name, 
        code=branch_in.code,
        department_id=branch_in.department_id
    )
    db.add(branch)
    db.commit()
    db.refresh(branch)
    return branch
