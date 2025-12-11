import os
import shutil
from pathlib import Path
from typing import Optional
from fastapi import UploadFile
from datetime import datetime
from app.core.config import settings

def get_storage_path(
    category: str, 
    student_id: int, 
    **kwargs
) -> Path:
    """
    Generate a structured storage path.
    
    Args:
        category: 'vault' or 'application'
        student_id: ID of the student
        kwargs: 
            - document_type: str (for vault)
            - scholarship_id: int (for application)
            - application_id: int (for application)
            - year: int (optional, defaults to current year)
            
    Returns:
        Path object representing the directory
    """
    base_path = Path(settings.MEDIA_DIR) / "students" / str(student_id)
    
    if category == "vault":
        doc_type = kwargs.get("document_type", "uncategorized")
        # Sanitize doc_type to be folder friendly
        doc_type = "".join(c for c in doc_type if c.isalnum() or c in (' ', '_', '-')).strip().replace(' ', '_').lower()
        return base_path / "vault" / doc_type
        
    elif category == "application":
        year = kwargs.get("year", datetime.now().year)
        scholarship_id = kwargs.get("scholarship_id")
        application_id = kwargs.get("application_id")
        
        if not scholarship_id or not application_id:
            raise ValueError("scholarship_id and application_id are required for application storage")
            
        return base_path / "applications" / str(year) / str(scholarship_id) / str(application_id)
        
    else:
        raise ValueError(f"Unknown category: {category}")

def save_upload_file(
    file: UploadFile, 
    destination_dir: Path,
    filename_override: Optional[str] = None
) -> str:
    """
    Save an uploaded file to the destination directory.
    Handles directory creation and filename uniqueness.
    
    Returns:
        Relative path string (for DB storage)
    """
    if not destination_dir.exists():
        destination_dir.mkdir(parents=True, exist_ok=True)
        
    filename = filename_override or file.filename
    # Ensure unique filename if exists
    file_path = destination_dir / filename
    if file_path.exists():
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        stem = Path(filename).stem
        suffix = Path(filename).suffix
        filename = f"{stem}_{timestamp}{suffix}"
        file_path = destination_dir / filename
        
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Return path relative to MEDIA_DIR parent (or just /media/...)
    # settings.MEDIA_DIR is usually "media"
    # We want to store "/media/students/..." in DB
    
    # Calculate relative path from project root
    # Assuming settings.MEDIA_DIR is relative to root
    
    # Let's construct the URL path. 
    # If MEDIA_DIR is "media", path is "media/students/..."
    # We usually serve this under /media mount.
    
    # Calculate relative path from MEDIA_DIR
    try:
        relative_path = file_path.relative_to(Path(settings.MEDIA_DIR))
        # Return path with forward slashes for URL compatibility
        return f"/{relative_path.as_posix()}"
    except ValueError:
        # If not relative to MEDIA_DIR, try relative to current working directory
        try:
            relative_path = file_path.relative_to(Path.cwd())
            return f"/{relative_path.as_posix()}"
        except ValueError:
            # Fallback: return absolute path converted to forward slashes
            return f"/{file_path.as_posix().replace(os.sep, '/')}"

def copy_file(
    source_path_str: str,
    destination_dir: Path
) -> str:
    """
    Copy a file from source path (DB string) to destination directory.
    
    Args:
        source_path_str: The path stored in DB (e.g., "/media/students/1/vault/...")
        destination_dir: Path object for destination
        
    Returns:
        New relative path string
    """
    # Convert DB path to absolute system path
    # DB path: /media/students/...
    # System path: C:\...\media\students\...
    
    # Remove leading slash if present
    clean_path = source_path_str.lstrip("/")
    
    # Try to resolve path relative to MEDIA_DIR first
    # If path starts with "media/", resolve relative to current working directory
    if clean_path.startswith(settings.MEDIA_DIR + "/") or clean_path.startswith(settings.MEDIA_DIR + "\\"):
        source_abs_path = Path(os.getcwd()) / clean_path
    else:
        # Try as absolute path first
        source_abs_path = Path(clean_path).resolve()
        
        # Fallback 1: try relative to current working directory
        if not source_abs_path.exists():
            source_abs_path = Path(os.getcwd()) / clean_path
            
        # Fallback 2: try relative to MEDIA_DIR (CRITICAL FIX)
        if not source_abs_path.exists():
             source_abs_path = Path(os.getcwd()) / settings.MEDIA_DIR / clean_path
         
    if not source_abs_path.exists():
        raise FileNotFoundError(f"Source file not found: {source_path_str} (resolved to: {source_abs_path})")
        
    if not destination_dir.exists():
        destination_dir.mkdir(parents=True, exist_ok=True)
        
    filename = source_abs_path.name
    dest_file_path = destination_dir / filename
    
    # Ensure unique
    if dest_file_path.exists():
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        stem = source_abs_path.stem
        suffix = source_abs_path.suffix
        filename = f"{stem}_{timestamp}{suffix}"
        dest_file_path = destination_dir / filename
        
    # Try to hard link first (saves space, keeps same inode)
    try:
        os.link(source_abs_path, dest_file_path)
    except OSError:
        # Fallback to copy if hard link fails (e.g. cross-device)
        shutil.copy2(source_abs_path, dest_file_path)
    
    # Calculate relative path from MEDIA_DIR
    try:
        relative_path = dest_file_path.relative_to(Path(settings.MEDIA_DIR))
        return f"/{relative_path.as_posix()}"
    except ValueError:
        # If not relative to MEDIA_DIR, try relative to current working directory
        try:
            relative_path = dest_file_path.relative_to(Path.cwd())
            return f"/{relative_path.as_posix()}"
        except ValueError:
            # Fallback: return absolute path converted to forward slashes
            return f"/{dest_file_path.as_posix().replace(os.sep, '/')}"

def delete_file(path_str: str) -> bool:
    """
    Delete a file from the filesystem.
    
    Args:
        path_str: Relative path stored in DB
        
    Returns:
        bool: True if deleted, False if not found/error
    """
    if not path_str:
        return False
        
    try:
        # Resolve path similar to copy_file
        clean_path = path_str.lstrip("/")
        
        if clean_path.startswith(settings.MEDIA_DIR + "/") or clean_path.startswith(settings.MEDIA_DIR + "\\"):
            abs_path = Path(os.getcwd()) / clean_path
        else:
            abs_path = Path(clean_path).resolve()
            if not abs_path.exists():
                abs_path = Path(os.getcwd()) / clean_path
            if not abs_path.exists():
                abs_path = Path(os.getcwd()) / settings.MEDIA_DIR / clean_path
                
        if abs_path.exists() and abs_path.is_file():
            os.remove(abs_path)
            return True
        return False
    except Exception as e:
        print(f"Error deleting file {path_str}: {e}")
        return False
