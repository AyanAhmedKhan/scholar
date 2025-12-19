import os
from pathlib import Path

BASE_DIR = Path(__file__).parent
MEDIA_DIR = BASE_DIR / "media"

print(f"Checking media directory: {MEDIA_DIR}")

if not MEDIA_DIR.exists():
    print("MEDIA_DIR does not exist!")
else:
    print("Listing all files in media directory:")
    for root, dirs, files in os.walk(MEDIA_DIR):
        for file in files:
            full_path = Path(root) / file
            rel_path = full_path.relative_to(MEDIA_DIR)
            print(f"Found: {rel_path} (Size: {full_path.stat().st_size} bytes)")
