import uvicorn
import sys
import os
import traceback
import logging

# Configure logging to file
logging.basicConfig(filename='startup_error.log', level=logging.DEBUG)

print("Attempting to start Uvicorn...")
try:
    sys.path.append(os.getcwd())
    # Import app to check for immediate import errors
    from app.main import app
    print("App imported successfully.")
    
    # Run Uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
except Exception as e:
    error_msg = f"Failed to start server:\n{traceback.format_exc()}"
    print(error_msg)
    logging.error(error_msg)
    with open("startup_error.log", "w") as f:
        f.write(error_msg)
