# Unified Scholarship Information System

A production-grade scholarship management system designed to streamline the application, verification, and disbursement process. Built with a **FastAPI** backend and **React** frontend, featuring role-based access control and automated document processing.

## 🚀 Tech Stack

- **Backend**: FastAPI (Python), SQLAlchemy, Pydantic
- **Frontend**: React, Vite, Tailwind CSS
- **Database**: MySQL
- **Task Queue**: Celery + Redis (for PDF merging and async tasks)
- **Authentication**: JWT & OAuth2 (Google)

## 👥 User Roles & Workflows

### 1. Student
- **Profile Management**: Maintain a detailed profile (Personal, Academic, Bank, Income).
- **Document Vault**: Upload documents once (Income Cert, Marksheets) and reuse them for multiple applications.
- **Application**: Apply for eligible scholarships.
- **Tracking**: Real-time status tracking with feedback.

### 2. General Office (GOffice)
- **Verification Dashboard**: View all submitted applications.
- **Document Verification**: Verify or reject individual documents with remarks.
- **Status Management**:
    -   `Submitted` -> `Under Verification`: Start processing.
    -   `Docs Required`: Request additional info/documents from the student.
    -   `Approved` / `Rejected`: Final decision.
- **PDF Generation**: One-click generation of merged application PDFs.

### 3. Department Head
- **Student Oversight**: View students and applications within their department.
- **Statistics**: Access department-level analytics (Total Applications, Pending, Approved).

### 4. Super Admin
- **User Management**: Manage roles and permissions.
- **System Configuration**: Manage scholarship schemes and master data.

## ✨ Key Features

- **Granular Verification Flow**: Supports a multi-step verification process (`Draft` -> `Submitted` -> `Under Verification` -> `Docs Required` -> `Approved`/`Rejected`).
- **Document Vault**: Centralized repository for student documents to reduce redundancy.
- **Automated PDF Merging**: Background tasks merge application forms and uploaded documents into a single PDF for easy archiving.
- **Responsive UI**: Modern, clean interface built with Tailwind CSS.

## 🛠️ Setup & Running Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **MySQL Server**
- **Redis Server** (Required for background tasks)

### 1. Backend Setup
Navigate to the `backend` directory:
```bash
cd backend
```

#### Environment Variables
Copy the sample configuration file and update it with your credentials:
```bash
cp .env.sample .env
```
> **Important**: Update `DATABASE_URL`, `REDIS_URL`, and `MAIL_` settings in `.env`.

#### Install Dependencies
Create a virtual environment and install Python packages:
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

#### Database Migrations
Initialize the database schema:
```bash
alembic upgrade head
```

#### Start Backend Server
Run the FastAPI development server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
The API will be available at `http://localhost:8000`. API Docs: `http://localhost:8000/docs`.

#### Start Celery Worker (Background Tasks)
Open a new terminal, activate the virtual environment, and run:
```bash
# Windows (requires gevent)
celery -A app.celery_app worker --loglevel=info -P gevent

# Linux/Mac
celery -A app.celery_app worker --loglevel=info
```

### 2. Frontend Setup
Navigate to the `frontend` directory:
```bash
cd frontend
```

#### Install Dependencies
```bash
npm install
```

#### Start Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### 3. Verification
1.  Open `http://localhost:5173` in your browser.
2.  Login with Google (ensure `GOOGLE_CLIENT_ID` is set in backend `.env`).
3.  Test document upload (files are saved to `backend/media/`).
4.  Test email notifications (check console logs if SMTP is not configured, or inbox if configured).

### 4. Troubleshooting
-   **Database Connection Error**: Check `DATABASE_URL` in `.env` and ensure MySQL is running.
-   **Redis Error**: Ensure Redis server is running (`redis-server`).
-   **Missing Dependencies**: Run `pip install -r requirements.txt` (backend) or `npm install` (frontend) again.
-   **CORS Error**: Ensure `BACKEND_CORS_ORIGINS` in `backend/app/core/config.py` includes your frontend URL.
