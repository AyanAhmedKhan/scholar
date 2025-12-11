import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash, verify_password

def reset_admin():
    db = SessionLocal()
    email = "ayanakhan@example.com"
    password = "admin"
    
    try:
        print(f"Checking for user {email}...")
        user = db.query(User).filter(User.email == email).first()
        
        if user:
            print(f"User found. Updating password...")
            user.hashed_password = get_password_hash(password)
            user.role = UserRole.ADMIN
            user.is_active = True
        else:
            print(f"User not found. Creating...")
            user = User(
                email=email,
                hashed_password=get_password_hash(password),
                full_name="Ayana Khan",
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(user)
        
        db.commit()
        db.refresh(user)
        print("User saved.")
        
        # Verify
        print("Verifying password...")
        if verify_password(password, user.hashed_password):
            print("Password verification SUCCESS.")
        else:
            print("Password verification FAILED.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin()
