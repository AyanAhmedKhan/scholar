import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

def create_superuser():
    db = SessionLocal()
    email = "ayankhan@mits.com"
    password = "admin"
    full_name = "Ayan Khan"
    
    try:
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        
        if user:
            print(f"User {email} already exists. Updating role to ADMIN.")
            user.role = UserRole.ADMIN
            user.is_active = True
            if not user.hashed_password:
                user.hashed_password = get_password_hash(password)
        else:
            print(f"Creating new superuser: {email}")
            user = User(
                email=email,
                hashed_password=get_password_hash(password),
                full_name=full_name,
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(user)
        
        db.commit()
        db.refresh(user)
        print(f"Superuser created/updated successfully.")
        print(f"Email: {email}")
        print(f"Password: {password}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_superuser()
