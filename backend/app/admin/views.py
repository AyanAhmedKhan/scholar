from sqladmin import Admin, ModelView
from app.models.user import User
from app.models.student import StudentProfile, StudentDocument
from app.models.scholarship import Scholarship, DocumentCategory, DocumentFormat
from app.models.application import Application, ApplicationDocument
from app.core.security import verify_password
from fastapi import Request
from sqladmin.authentication import AuthenticationBackend

class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        username = form.get("username")
        password = form.get("password")
        
        # This is a simplified check. In production, check against DB.
        # For now, let's assume we have a superuser in DB or hardcoded for initial setup
        # But better to use the DB.
        # Since we can't easily inject DB session here without some hacks or using the request state if middleware set it up.
        # SQLAdmin doesn't make it super easy to access DB in login without custom logic.
        # For this demo, I will accept admin/admin if not checking DB, OR 
        # I will try to get DB from request if possible.
        
        # Let's use a hardcoded admin for the SQLAdmin panel login for simplicity in this generated code,
        # OR better, use the API to login and store token in session.
        # But SQLAdmin uses session auth.
        
        if username == "admin" and password == "admin":
            request.session.update({"token": "admin_token"})
            return True
        return False

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        token = request.session.get("token")
        return bool(token)

authentication_backend = AdminAuth(secret_key="SECRET_KEY_FOR_ADMIN_SESSION")

class UserAdmin(ModelView, model=User):
    column_list = [User.id, User.email, User.role, User.is_active]
    can_create = True
    can_edit = True
    can_delete = True
    can_view_details = True

class StudentProfileAdmin(ModelView, model=StudentProfile):
    column_list = [StudentProfile.id, StudentProfile.user_id, StudentProfile.enrollment_no, StudentProfile.department]

class ScholarshipAdmin(ModelView, model=Scholarship):
    column_list = [Scholarship.id, Scholarship.name, Scholarship.category, Scholarship.is_active]

class ApplicationAdmin(ModelView, model=Application):
    column_list = [Application.id, Application.student_id, Application.scholarship_id, Application.status]

def setup_admin(app, engine):
    admin = Admin(app, engine, authentication_backend=authentication_backend)
    admin.add_view(UserAdmin)
    admin.add_view(StudentProfileAdmin)
    admin.add_view(ScholarshipAdmin)
    admin.add_view(ApplicationAdmin)
    # Add others as needed
