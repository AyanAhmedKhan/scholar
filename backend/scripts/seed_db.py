import sys
import os
import datetime

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.university import Department, Branch, SessionYear
from app.models.scholarship import Scholarship, DocumentCategory, DocumentFormat, ScholarshipDocumentRequirement
from app.models.student import StudentProfile
from app.models.notice import Notice
from app.models.application import Application, ApplicationStatus

def seed_db():
    db = SessionLocal()
    print("🌱 Seeding Database...")

    try:
        # 1. Clear existing data (optional, or just check)
        # For safety in dev, we might just want to add if missing. 
        # But for a true 'seed', clearing is often expected. 
        # WARNING: This truncates! Use with caution.
        # db.query(Application).delete()
        # db.query(StudentProfile).delete()
        # db.query(Scholarship).delete()
        # db.query(User).delete()
        # db.commit()
        
        # 2. Departments & Branches
        print(" -> Seeding Departments...")
        depts = [
            {"name": "Computer Science & Engineering", "code": "CSE", "branches": ["CSE", "IT", "IOT"]},
            {"name": "Electrical Engineering", "code": "EE", "branches": ["EE", "EL"]},
            {"name": "Mechanical Engineering", "code": "ME", "branches": ["ME", "Auto"]},
            {"name": "Civil Engineering", "code": "CE", "branches": ["CE"]},
        ]
        
        dept_objs = {}
        for d in depts:
            dept = db.query(Department).filter_by(name=d["name"]).first()
            if not dept:
                dept = Department(name=d["name"], code=d["code"])
                db.add(dept)
                db.flush() # get ID
            dept_objs[d["code"]] = dept
            
            for b_code in d["branches"]:
                branch = db.query(Branch).filter_by(name=b_code).first()
                if not branch:
                    branch = Branch(name=b_code, code=b_code, department_id=dept.id)
                    db.add(branch)

        # 3. Session Years
        print(" -> Seeding Session Years...")
        sessions = ["2024-2025", "2023-2024"]
        for s in sessions:
            if not db.query(SessionYear).filter_by(name=s).first():
                db.add(SessionYear(name=s))

        # 4. Users
        print(" -> Seeding Users...")
        users_data = [
            {"email": "admin@mits.com", "password": "admin", "role": UserRole.ADMIN, "name": "Super Admin"},
            {"email": "student@mits.com", "password": "student", "role": UserRole.STUDENT, "name": "Rahul Kumar"},
            {"email": "hod_cse@mits.com", "password": "hod", "role": UserRole.DEPT_HEAD, "name": "HOD CSE", "dept": "CSE"},
            {"email": "goffice@mits.com", "password": "goffice", "role": UserRole.GOFFICE, "name": "General Office"},
        ]
        
        created_users = {}
        for u in users_data:
            user = db.query(User).filter_by(email=u["email"]).first()
            if not user:
                user = User(
                    email=u["email"],
                    hashed_password=get_password_hash(u["password"]),
                    full_name=u["name"],
                    role=u["role"],
                    department=dept_objs[u.get("dept")].name if u.get("dept") else None,
                    is_active=True
                )
                db.add(user)
                db.flush()
            created_users[u["email"]] = user

        # 5. Student Profile
        print(" -> Seeding Student Profile...")
        student_user = created_users["student@mits.com"]
        if not db.query(StudentProfile).filter_by(user_id=student_user.id).first():
            profile = StudentProfile(
                user_id=student_user.id,
                enrollment_no="0901CS211001",
                department="Computer Science & Engineering",
                branch="CSE",
                mobile_number="9876543210",
                date_of_birth=datetime.date(2003, 1, 1),
                gender="Male",
                father_name="Mukesh Kumar",
                mother_name="Sunita Devi",
                category="OBC",
                annual_family_income=95000.0, # Eligible for Post Matric
                current_year_or_semester="3rd Year",
                percentage_12th=85.5,
                previous_exam_percentage=8.2,
                residential_status="Day Scholar"
            )
            db.add(profile)

        # 6. Document Formats
        print(" -> Seeding Document Formats...")
        doc_formats = [
            {"name": "Income Certificate", "desc": "Valid income certificate by Tehsildar"},
            {"name": "Caste Certificate", "desc": "Digital Caste Certificate"},
            {"name": "Mark Sheet (12th)", "desc": "Class 12th Marksheet"},
            {"name": "Last Exam Marksheet", "desc": "Previous semester or year marksheet"},
            {"name": "Bank Passbook", "desc": "Front page of bank passbook"},
        ]
        
        doc_fmt_objs = []
        for df in doc_formats:
            fmt = db.query(DocumentFormat).filter_by(name=df["name"]).first()
            if not fmt:
                fmt = DocumentFormat(name=df["name"], description=df["desc"])
                db.add(fmt)
                db.flush()
            doc_fmt_objs.append(fmt)

        # 7. Scholarships
        print(" -> Seeding Scholarships...")
        if not db.query(Scholarship).filter_by(name="Post Matric Scholarship (OBC)").first():
            sch = Scholarship(
                name="Post Matric Scholarship (OBC)",
                description="Financial assistance for OBC students with family income < 3 Lakhs.",
                category="Need Based",
                max_family_income=300000.0,
                min_percentage=60.0,
                allowed_categories=["OBC"],
                last_date=datetime.date(2025, 12, 31),
                is_active=True,
                govt_job_allowed=False,
                application_link="https://www.tribal.mp.gov.in/mptaas"
            )
            db.add(sch)
            db.flush()
            
            # Allow for new batches (JSON assumed simple list)
            # sch.allowed_batches_new = ["2024-2025"] 

            # Requirements
            reqs = [
                (doc_fmt_objs[0], True), # Income
                (doc_fmt_objs[1], True), # Caste
                (doc_fmt_objs[4], True), # Bank
            ]
            for fmt, mandatory in reqs:
                db.add(ScholarshipDocumentRequirement(
                    scholarship_id=sch.id,
                    document_format_id=fmt.id,
                    is_mandatory=mandatory
                ))

        if not db.query(Scholarship).filter_by(name="Merit Cum Means").first():
            sch2 = Scholarship(
                name="Merit Cum Means",
                description="For meritorious students from economically weaker sections.",
                category="Merit Based",
                min_cgpa=8.0,
                max_family_income=500000.0,
                last_date=datetime.date(2025, 10, 15),
                is_active=True
            )
            db.add(sch2)
            db.flush()
            # Requirements
            db.add(ScholarshipDocumentRequirement(scholarship_id=sch2.id, document_format_id=doc_fmt_objs[3].id)) # Last Exam Marksheet

        # 8. Notices
        print(" -> Seeding Notices...")
        if not db.query(Notice).filter(Notice.title.like("%Welcome%")).first():
            db.add(Notice(
                title="Welcome to the New Portal",
                content="<p>All students are requested to complete their profile registration by 30th Dec.</p>",
                created_by=created_users["admin@mits.com"].id
            ))
            db.add(Notice(
                title="Scholarship Deadline Extended",
                content="<p>Given the heavy traffic, the deadline for Post Matric has been extended.</p>",
                created_by=created_users["admin@mits.com"].id
            ))

        db.commit()
        print("✅ Database Seeded Successfully!")

    except Exception as e:
        print(f"❌ Error Seeding Database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
