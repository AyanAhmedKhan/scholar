
from sqlalchemy import create_engine, inspect, text
from app.core.config import settings
import sys

def check_db():
    try:
        engine = create_engine(settings.DATABASE_URL)
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"Tables found: {tables}")
        
        if 'notices' in tables:
            print("Table 'notices' exists.")
            cols = [c['name'] for c in inspector.get_columns('notices')]
            print(f"Notices columns: {cols}")
        else:
            print("ERROR: Table 'notices' DOES NOT exist.")

        if 'scholarship_document_requirements' in tables:
             cols = [c['name'] for c in inspector.get_columns('scholarship_document_requirements')]
             print(f"Scholarship Doc Req columns: {cols}")
             if 'allowed_types' not in cols:
                 print("ERROR: 'allowed_types' column missing in scholarship_document_requirements")
        
        if 'student_documents' in tables:
             cols = [c['name'] for c in inspector.get_columns('student_documents')]
             print(f"Student Document columns: {cols}")
             if 'mime_type' not in cols:
                 print("ERROR: 'mime_type' column missing in student_documents")

    except Exception as e:
        print(f"Database connection failed: {e}")

if __name__ == "__main__":
    check_db()
