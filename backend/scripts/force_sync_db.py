import sys
import os
import logging

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import engine, Base

# Import ALL models so they are registered with Base.metadata
from app.models.user import User
from app.models.student import StudentProfile, StudentDocument
from app.models.scholarship import Scholarship, DocumentCategory, DocumentFormat, ScholarshipDocumentRequirement, Announcement
from app.models.application import Application, ApplicationDocument
from app.models.university import Department, Branch, SessionYear
from app.models.notice import Notice
# Import any other models if missed

def force_create_tables():
    print("🔄 Checking for missing database tables...")
    try:
        # This will create tables that do not exist.
        # It will NOT modify or delete existing tables.
        Base.metadata.create_all(bind=engine)
        print("✅ Tables synced successfully.")
        print("   (This ensured 'notices' and any other missing tables are created)")
    except Exception as e:
        print(f"❌ Error syncing database: {e}")

if __name__ == "__main__":
    force_create_tables()
