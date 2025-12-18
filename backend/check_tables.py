import sys
import os
from sqlalchemy import create_engine, inspect

# Ensure app imports work
sys.path.append(os.getcwd())

try:
    from app.core.config import settings
    
    print(f"Checking tables in: {settings.DATABASE_URL}")
    engine = create_engine(settings.DATABASE_URL)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    print(f"Found {len(tables)} tables: {', '.join(tables)}")
    
    required = ["users", "scholarships", "student_profiles", "applications"]
    missing = [t for t in required if t not in tables]
    
    if missing:
        print(f"❌ MISSING TABLES: {', '.join(missing)}")
        print("Run migration command:")
        print("alembic upgrade head")
    else:
        print("✅ Core tables seem to exist.")
        
except Exception as e:
    print(f"❌ Error checking tables: {e}")
