
import sys
import os

# Ensure current directory is in sys.path
sys.path.append(os.getcwd())

try:
    from app.core.config import settings
    print("BACKEND_CORS_ORIGINS:", settings.BACKEND_CORS_ORIGINS)
    print("Verification Successful")
except Exception as e:
    print(f"Verification Failed: {e}")
