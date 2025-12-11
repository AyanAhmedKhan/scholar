from app.celery_app import celery_app
from app.core.email import send_email_async, get_email_template
from typing import List, Dict, Any
import asyncio

# Wrapper to run async function in sync Celery task
def run_async(coro):
    loop = asyncio.get_event_loop()
    if loop.is_running():
        return loop.create_task(coro)
    else:
        return loop.run_until_complete(coro)

@celery_app.task
def send_email_task(subject: str, recipients: List[str], body: str):
    """
    Generic Celery task to send emails.
    """
    # Since Celery runs in a separate process/thread, we need to handle async properly
    # For simplicity in this environment, we'll use asyncio.run or similar
    # But fastapi-mail is async. 
    # Best practice: Use an async-compatible worker or run_until_complete.
    
    asyncio.run(send_email_async(subject, recipients, body))
    return f"Email sent to {len(recipients)} recipients"

@celery_app.task
def send_notification_task(notification_type: str, recipients: List[str], data: Dict[str, Any]):
    """
    Task to generate email body from template and send it.
    """
    body = get_email_template(notification_type, data)
    subject_map = {
        "application_submitted": "Application Submitted Successfully",
        "application_approved": "Scholarship Application Approved",
        "application_rejected": "Scholarship Application Status Update",
        "docs_required": "Action Required: Documents Needed",
        "scholarship_added": f"New Scholarship Alert: {data.get('scholarship_name')}",
        "scholarship_updated": f"Update: {data.get('scholarship_name')}",
        "notice_published": f"Notice: {data.get('title')}",
        "custom_message": data.get('subject', "Message from Scholarship Cell")
    }
    subject = subject_map.get(notification_type, "Notification")
    
    asyncio.run(send_email_async(subject, recipients, body))
    return f"Notification '{notification_type}' sent to {len(recipients)} recipients"
