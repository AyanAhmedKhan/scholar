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
    # Colors
    primary_color = "#1e40af" # Blue
    accent_color = "#f59e0b" # Amber
    bg_color = "#f3f4f6"
    text_color = "#374151"
    
    # Logo URL (Assuming served from frontend public folder or a known URL)
    # Using the domain from .env if possible, otherwise placeholder
    logo_url = "https://scholar.mitsgwalior.in/mits-logo.png" # Assuming this is accessible

    base_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: {bg_color}; margin: 0; padding: 0; color: {text_color}; }}
            .container {{ max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }}
            .header {{ background-color: {primary_color}; padding: 20px; text-align: center; color: white; }}
            .header img {{ max-height: 60px; margin-bottom: 10px; }}
            .header h1 {{ margin: 0; font-size: 24px; font-weight: 600; }}
            .content {{ padding: 30px; line-height: 1.6; }}
            .footer {{ background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }}
            .btn {{ display: inline-block; padding: 10px 20px; background-color: {primary_color}; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }}
            .info-box {{ background-color: #eff6ff; border-left: 4px solid {primary_color}; padding: 15px; margin: 20px 0; border-radius: 4px; }}
            .highlight {{ color: {primary_color}; font-weight: bold; }}
            .status-badge {{ display: inline-block; padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold; color: white; background-color: {accent_color}; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="{logo_url}" alt="MITS Scholar Logo">
                <h1>MITS Scholar</h1>
            </div>
            <div class="content">
                {{content}}
            </div>
            <div class="footer">
                <p>&copy; 2025 MITS Gwalior. All rights reserved.</p>
                <p>Madhav Institute of Technology & Science, Gwalior (M.P.), India</p>
                <p>This is an automated message. Please do not reply directly to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """

    templates = {
        "application_submitted": """
            <h2>Application Submitted Successfully</h2>
            <p>Dear {student_name},</p>
            <p>We have received your application for <span class="highlight">{scholarship_name}</span>.</p>
            <div class="info-box">
                <p><strong>Application ID:</strong> #{application_id}</p>
                <p><strong>Status:</strong> Submitted</p>
            </div>
            <p>Our team will review your documents shortly. You can track your application status on your dashboard.</p>
            <center><a href="https://scholar.mitsgwalior.in/dashboard" class="btn">View Application</a></center>
        """,
        "application_approved": """
            <h2>🎉 Application Approved!</h2>
            <p>Dear {student_name},</p>
            <p>We are pleased to inform you that your application for <span class="highlight">{scholarship_name}</span> has been <strong>APPROVED</strong>.</p>
            <p>The scholarship amount will be processed and disbursed to your registered bank account soon.</p>
            <center><a href="https://scholar.mitsgwalior.in/dashboard" class="btn">Check Status</a></center>
        """,
        "application_rejected": """
            <h2>Application Status Update</h2>
            <p>Dear {student_name},</p>
            <p>Your application for <span class="highlight">{scholarship_name}</span> has been updated.</p>
            <div class="info-box" style="border-left-color: #ef4444; background-color: #fef2f2;">
                <p><strong>New Status:</strong> Rejected</p>
                <p><strong>Reason:</strong> {remarks}</p>
            </div>
            <p>If you believe this is an error, please contact the scholarship cell.</p>
        """,
        "docs_required": """
            <h2>⚠️ Action Required: Documents Needed</h2>
            <p>Dear {student_name},</p>
            <p>We need some additional information/documents for your <span class="highlight">{scholarship_name}</span> application.</p>
            <div class="info-box" style="border-left-color: #f59e0b; background-color: #fffbeb;">
                <p><strong>Details:</strong> {remarks}</p>
            </div>
            <p>Please log in to the portal and update your application immediately to avoid delay or rejection.</p>
            <center><a href="https://scholar.mitsgwalior.in/dashboard" class="btn">Update Now</a></center>
        """,
        "scholarship_added": """
            <h2>New Scholarship Announced! 📢</h2>
            <p>Dear Student,</p>
            <p>The Scholarship Cell has announced a new scholarship opportunity: <span class="highlight">{scholarship_name}</span>.</p>
            <div class="info-box">
                <p><strong>Category:</strong> {category}</p>
                <p><strong>Last Date to Apply:</strong> {last_date}</p>
            </div>
            <p>Check your eligibility and apply before the deadline.</p>
            <center><a href="https://scholar.mitsgwalior.in/scholarships" class="btn">View Details</a></center>
        """,
        "scholarship_updated": """
            <h2>Scholarship Update 📝</h2>
            <p>Dear Student,</p>
            <p>There has been an important update to the <span class="highlight">{scholarship_name}</span> scholarship.</p>
            <div class="info-box">
                <p><strong>What Changed:</strong></p>
                <p>{changes_summary}</p> 
            </div>
            <p>Please review the updated details on the portal.</p>
            <center><a href="https://scholar.mitsgwalior.in/scholarships" class="btn">View Scholarship</a></center>
        """,
        "notice_published": """
            <h2>New Notice Published 📌</h2>
            <p>Dear Student,</p>
            <p>A new notice has been published on the MITS Scholar Portal.</p>
            <div class="info-box">
                <p><strong>{title}</strong></p>
                <p>{content}</p>
            </div>
            <center><a href="https://scholar.mitsgwalior.in/notices" class="btn">View All Notices</a></center>
        """,
        "custom_message": """
            <h2>Message from Scholarship Cell</h2>
            <div class="content">
                {body}
            </div>
        """
    }
    
    # Render content
    content_html = templates.get(notification_type, "<p>{body}</p>")
    
    # Handle missing 'changes_summary' gracefully
    if notification_type == "scholarship_updated" and "changes_summary" not in data:
         data["changes_summary"] = "General details have been updated. Please check the portal."

    try:
        rendered_content = content_html.format(**data)
    except KeyError as e:
        rendered_content = content_html.format(**data, **{k: "N/A" for k in [str(e).strip("'")]}) # Fallback for missing keys
        
    final_html = base_html.format(content=rendered_content)
    return final_html
