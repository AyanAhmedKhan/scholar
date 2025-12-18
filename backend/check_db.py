import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

# Ensure app imports work
sys.path.append(os.getcwd())

try:
    from app.core.config import settings
    print(f"Testing connection to: {settings.DATABASE_URL}")
    
    engine = create_engine(settings.DATABASE_URL)
    connection = engine.connect()
    result = connection.execute(text("SELECT 1"))
    print("✅ Database connection successful!")
    connection.close()
    
except ImportError:
    print("❌ Error: Could not import app settings. Make sure you are in the 'backend' directory.")
except OperationalError as e:
    print(f"\n❌ Database Connection Failed:\n{e}")
    print("\nTip: Check your credentials in .env or ensure MySQL is running.")
except Exception as e:
    print(f"\n❌ Unexpected Error:\n{e}")
