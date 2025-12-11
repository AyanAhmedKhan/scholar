import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal
from app.models.user import User, UserRole

def promote_superuser():
    db = SessionLocal()
    try:
        # Find user with email containing 'ayanakhan'
        user = db.query(User).filter(User.email.like('%ayanakhan%')).first()
        
        if not user:
            print("User 'ayanakhan' not found.")
            return
            
        print(f"Found user: {user.email} (Current Role: {user.role})")
        
        user.role = UserRole.ADMIN
        db.commit()
        db.refresh(user)
        
        print(f"User {user.email} promoted to ADMIN.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    promote_superuser()
