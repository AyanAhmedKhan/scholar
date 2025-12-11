from celery import shared_task

@shared_task
def send_email_task(email: str, subject: str, body: str):
    # Placeholder for email sending logic
    print(f"Sending email to {email}: {subject}")
    return True
