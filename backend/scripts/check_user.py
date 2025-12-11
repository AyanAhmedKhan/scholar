import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal
from app.models.user import User

def check_user():
    db = SessionLocal()
    email = "ayanakhan@example.com"
    
    try:
        user = db.query(User).filter(User.email == email).first()
        
        if user:
            print(f"User found: {user.email}")
            print(f"Role: {user.role}")
            print(f"Is Active: {user.is_active}")
            print(f"Hashed Password: {user.hashed_password[:10]}..." if user.hashed_password else "No Password")
        else:
            print(f"User {email} NOT found.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_user()
