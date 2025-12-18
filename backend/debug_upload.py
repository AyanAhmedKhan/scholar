import sys
import os
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.storage import get_storage_path

def test_upload_permissions():
    print(f"User: {os.getlogin()}")
    print(f"CWD: {os.getcwd()}")
    print(f"Media Dir (Settings): {settings.MEDIA_DIR}")
    
    media_path = Path(settings.MEDIA_DIR)
    print(f"Media Path (Resolved): {media_path.resolve()}")
    
    if not media_path.exists():
        print("❌ Media directory does not exist. Attempting to create...")
        try:
            media_path.mkdir(parents=True, exist_ok=True)
            print("✅ Created media directory.")
        except Exception as e:
            print(f"❌ Failed to create media directory: {e}")
            return

    if not os.access(media_path, os.W_OK):
        print("❌ Media directory is NOT writable.")
    else:
        print("✅ Media directory is writable.")

    # Test Path Logic
    try:
        print("\nTesting Storage Path Logic...")
        dest = get_storage_path(
            category="vault", 
            student_id=1, 
            enrollment_no="TEST_ENROLLMENT", 
            document_type="income_certificate"
        )
        print(f"Target Destination: {dest}")
        
        if not dest.exists():
            print("Target dir does not exist. Creating...")
            dest.mkdir(parents=True, exist_ok=True)
            print("✅ Created target directory.")
            
        test_file = dest / "test_write.txt"
        with open(test_file, "w") as f:
            f.write("test")
        print(f"✅ Successfully wrote test file to {test_file}")
        os.remove(test_file)
        print("✅ Successfully deleted test file.")
        
    except Exception as e:
        print(f"❌ Error during path/write test: {e}")

if __name__ == "__main__":
    test_upload_permissions()
