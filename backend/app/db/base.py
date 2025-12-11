# Import all the models, so that Base has them before being
# imported by Alembic
from app.db.database import Base  # noqa
from app.models.user import User  # noqa
from app.models.scholarship import Scholarship, ScholarshipDocumentRequirement, DocumentFormat, Announcement  # noqa
from app.models.application import Application, ApplicationDocument  # noqa
from app.models.student import StudentProfile, StudentDocument  # noqa
from app.models.notice import Notice  # noqa
from app.models.university import Department, SessionYear  # noqa
