@echo off
echo Running Database Migrations...
alembic upgrade head
if %errorlevel% neq 0 (
    echo Migration Failed!
    exit /b %errorlevel%
)
echo Migrations Applied Successfully!
pause
