from typing import List, Dict, Any
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from app.core.config import settings
from pathlib import Path

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=settings.USE_CREDENTIALS,
    VALIDATE_CERTS=settings.VALIDATE_CERTS
)

async def send_email_async(subject: str, email_to: List[str], body: str):
    message = MessageSchema(
        subject=subject,
        recipients=email_to,
        body=body,
        subtype=MessageType.html
    )
    fm = FastMail(conf)
    await fm.send_message(message)

# Templates for different notification types
def get_email_template(notification_type: str, data: Dict[str, Any]) -> str:
    templates = {
        "application_submitted": """
            <h2>Application Submitted</h2>
            <p>Dear {student_name},</p>
            <p>Your application for <strong>{scholarship_name}</strong> has been successfully submitted.</p>
            <p>Application ID: {application_id}</p>
            <p>We will notify you once the verification process begins.</p>
        """,
        "application_approved": """
            <h2>Application Approved!</h2>
            <p>Dear {student_name},</p>
            <p>Congratulations! Your application for <strong>{scholarship_name}</strong> has been APPROVED.</p>
            <p>The scholarship amount will be disbursed to your bank account shortly.</p>
        """,
        "application_rejected": """
            <h2>Application Status Update</h2>
            <p>Dear {student_name},</p>
            <p>Your application for <strong>{scholarship_name}</strong> has been rejected.</p>
            <p><strong>Reason:</strong> {remarks}</p>
            <p>Please contact the scholarship cell for more details.</p>
        """,
        "docs_required": """
            <h2>Action Required: Documents Needed</h2>
            <p>Dear {student_name},</p>
            <p>Your application for <strong>{scholarship_name}</strong> requires additional documentation or clarification.</p>
            <p><strong>Remarks:</strong> {remarks}</p>
            <p>Please log in to the portal and update your application immediately.</p>
        """,
        "scholarship_added": """
            <h2>New Scholarship Alert</h2>
            <p>Dear Student,</p>
            <p>A new scholarship <strong>{scholarship_name}</strong> has been announced.</p>
            <p><strong>Category:</strong> {category}</p>
            <p><strong>Last Date:</strong> {last_date}</p>
            <p>Check your eligibility and apply now!</p>
        """,
        "scholarship_updated": """
            <h2>Scholarship Update</h2>
            <p>Dear Student,</p>
            <p>There has been an update to the <strong>{scholarship_name}</strong> scholarship.</p>
            <p>Please check the portal for the latest details.</p>
        """,
        "notice_published": """
            <h2>New Notice Published</h2>
            <p>Dear Student,</p>
            <p>A new notice has been published: <strong>{title}</strong></p>
            <p>{content}</p>
        """,
        "custom_message": """
            <h2>Message from Scholarship Cell</h2>
            <p>{body}</p>
        """
    }
    
    template = templates.get(notification_type, "<p>{body}</p>")
    return template.format(**data)
