from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.pdf_tasks", "app.tasks.email_tasks"]
)

celery_app.conf.task_routes = {
    "app.tasks.pdf_tasks.*": {"queue": "pdf_queue"},
    "app.tasks.notification_tasks.*": {"queue": "email_queue"},
}

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
)
