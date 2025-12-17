@echo off
echo Starting Backend on Port 5001...
start "Backend Server" /d "..\backend" cmd /k "uvicorn app.main:app --host 0.0.0.0 --port 5001 > server.log 2>&1"

echo Starting Frontend on Port 4255 (SPA Mode)...
cd frontend
echo Make sure you have run 'npm run build' first!
echo Installing/Running 'serve' package...
call npx serve -s dist -l 4255

pause
