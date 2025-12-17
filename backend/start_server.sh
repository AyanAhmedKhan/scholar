#!/bin/bash

echo "Starting Backend on Port 5001..."
# Kill any existing process on port 5001 to avoid conflicts
fuser -k 5001/tcp > /dev/null 2>&1

# Start uvicorn in the background with nohup
nohup uvicorn app.main:app --host 0.0.0.0 --port 5001 > server.log 2>&1 &

echo "Backend started! Logs are being written to server.log"
echo "You can check logs with: tail -f server.log"
