import sys
from celery import Celery
from app.core.settings import get_settings

settings = get_settings()

celery_app = Celery(
    "flighttrackr",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.tasks.gmail_sync"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    result_expires=86400,  # 24h
    # Windows doesn't support fork()-based prefork pool (billiard PermissionError)
    worker_pool="solo" if sys.platform == "win32" else "prefork",
)
