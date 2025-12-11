import sys
import os

# Add current directory to path so we can import app
sys.path.append(os.getcwd())

from app.db.database import SessionLocal
from app.models.application import Application, ApplicationDocument
from app.models.student import StudentDocument
from app.models.user import User
from app.models.scholarship import Scholarship # Added to fix mapping error

def debug_application_docs(app_id):
    db = SessionLocal()
    try:
        print(f"--- Debugging Application {app_id} ---")
        application = db.query(Application).filter(Application.id == app_id).first()
        
        if not application:
            print(f"Application {app_id} NOT FOUND.")
            return

        user_id = application.student_id
        print(f"Student ID: {user_id}")
        
        # 1. Check Linked Documents (ApplicationDocument)
        app_docs = db.query(ApplicationDocument).filter(ApplicationDocument.application_id == app_id).all()
        print(f"\n[Linked Documents for App {app_id}]: {len(app_docs)}")
        for doc in app_docs:
            print(f" - ID: {doc.id}, Format: {doc.document_format_id}, Path: {doc.file_path}")

        # 2. Check User's Vault Documents (StudentDocument)
        print(f"\n[User's Vault Documents (StudentDocument)]: ")
        student_docs = db.query(StudentDocument).filter(StudentDocument.student_id == user_id).all()
        print(f"Total Found: {len(student_docs)}")
        
        for doc in student_docs:
            print(f" - ID: {doc.id}, Type: {doc.document_type}, Active: {doc.is_active}, Path: {doc.file_path}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_application_docs(9)
