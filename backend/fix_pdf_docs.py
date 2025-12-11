import sys
import os
import shutil

# Add current directory to path
sys.path.append(os.getcwd())

from app.db.database import SessionLocal
# Import ALL models to ensure SQLAlchemy registry is populated correctly
from app.models.user import User 
from app.models.scholarship import DocumentFormat, Scholarship
from app.models.application import Application, ApplicationDocument
from app.models.student import StudentDocument, StudentProfile
from app.core.storage import get_storage_path, copy_file

def fix_all_applications():
    db = SessionLocal()
    try:
        applications = db.query(Application).all()
        print(f"Found {len(applications)} total applications. Checking documents...")
        
        for app in applications:
            fix_single_application(db, app)
            
    except Exception as e:
        print(f"Critical Error in main loop: {e}")
    finally:
        db.close()

def fix_single_application(db, application):
    try:
        app_id = application.id
        user_id = application.student_id
        
        # Check if already has documents
        # existing_docs_count = db.query(ApplicationDocument).filter(ApplicationDocument.application_id == app_id).count()
        # if existing_docs_count > 0:
        #    print(f"App {app_id}: Has {existing_docs_count} docs. Skipping check (or could verify completeness).")
        #    # Optional: Removing this check allows adding MISSING docs even if some exist.
        
        # Get active student docs from vault
        student_docs = db.query(StudentDocument).filter(
            StudentDocument.student_id == user_id,
            StudentDocument.is_active == True
        ).all()
        
        if not student_docs:
            print(f"App {app_id}: No active documents in vault for student {user_id}.")
            return

        # print(f"App {app_id}: user {user_id} has {len(student_docs)} vault docs.")
        
        count = 0
        for doc in student_docs:
            # Check/Create Format
            fmt = db.query(DocumentFormat).filter(DocumentFormat.name == doc.document_type).first()
            if not fmt:
                fmt = DocumentFormat(name=doc.document_type, is_active=True)
                db.add(fmt)
                db.flush()
                
            # Check if *this specific document type* is already linked to the application
            existing_link = db.query(ApplicationDocument).filter(
                ApplicationDocument.application_id == app_id,
                ApplicationDocument.document_format_id == fmt.id
            ).first()
            
            if existing_link:
                continue

            # Copy and Link
            dest_dir = get_storage_path(
                category="application",
                student_id=user_id,
                scholarship_id=application.scholarship_id,
                application_id=application.id
            )
            
            try:
                # Trust copy_file to resolve the path (we fixed logic in storage.py)
                new_path = copy_file(doc.file_path, dest_dir)
                     
                app_doc = ApplicationDocument(
                    application_id=application.id,
                    document_format_id=fmt.id,
                    file_path=new_path,
                    is_verified=False
                )
                db.add(app_doc)
                count += 1
            except Exception as e:
                print(f" ! App {app_id}: Error linking {doc.document_type}: {e}")
        
        if count > 0:
            db.commit()
            print(f"App {app_id}: Successfully linked {count} NEW documents.")
        else:
            # print(f"App {app_id}: Up to date.")
            pass
            
    except Exception as e:
        print(f"Error processing App {application.id}: {e}")
        db.rollback()

if __name__ == "__main__":
    fix_all_applications()
