import logging
from datetime import datetime, timezone
from celery import Task
from googleapiclient.errors import HttpError
from app.tasks.celery_app import celery_app
from app.db.session import SyncSessionLocal
from app.models.gmail_sync_job import GmailSyncJob
from app.services.oauth_token_service import get_token_sync, decrypt_token
from app.services.gmail_service import GmailService
from app.services.flight_service import parsed_to_flight, upsert_flight_sync, get_existing_gmail_ids_sync
from app.services.parser_service import BoardingPassService
from app.parsers.factory import ParserFactory
from app.core.settings import get_settings

logger = logging.getLogger(__name__)


@celery_app.task(
    bind=True,
    max_retries=3,
    autoretry_for=(HttpError,),
    retry_backoff=True,
    retry_backoff_max=300,
    retry_jitter=True,
)
def sync_gmail_boarding_passes(self: Task, user_id: str, job_id: str) -> dict:
    """
    Scan the user's Gmail inbox for boarding pass PDFs, parse them,
    and upsert the results into the flights table.
    """
    settings = get_settings()

    with SyncSessionLocal() as session:
        job = session.get(GmailSyncJob, job_id)
        if not job:
            logger.error(f"GmailSyncJob {job_id} not found")
            return {"error": "job_not_found"}

        job.status = "running"
        job.started_at = datetime.now(timezone.utc)
        session.commit()

        try:
            # 1. Get Google refresh token
            token_record = get_token_sync(session, user_id)
            if not token_record:
                raise ValueError("No OAuth token found — user must re-authenticate")

            refresh_token = decrypt_token(token_record.refresh_token)
            gmail = GmailService(refresh_token)

            # 2. Search Gmail
            message_ids = gmail.search_messages(
                query=settings.gmail_search_query,
                max_results=settings.gmail_max_results,
            )
            job.emails_scanned = len(message_ids)
            session.commit()

            if not message_ids:
                job.status = "completed"
                job.completed_at = datetime.now(timezone.utc)
                session.commit()
                return {"emails_scanned": 0, "passes_found": 0, "passes_saved": 0}

            # 3. Skip already-synced messages
            existing_ids = get_existing_gmail_ids_sync(session, user_id, message_ids)
            new_ids = [mid for mid in message_ids if mid not in existing_ids]

            # 4. Parse and save
            parser_service = BoardingPassService(factory=ParserFactory())
            passes_found = 0
            passes_saved = 0

            for msg_id in new_ids:
                try:
                    attachments = gmail.get_pdf_attachments(msg_id)
                    for _filename, pdf_bytes in attachments:
                        try:
                            parsed = parser_service.process(pdf_bytes)
                            flight = parsed_to_flight(parsed, user_id, gmail_message_id=msg_id)
                            passes_found += 1
                            # Savepoint: a DB constraint violation rolls back only
                            # this row, leaving the session valid for the next message.
                            with session.begin_nested():
                                upsert_flight_sync(session, flight)
                            passes_saved += 1
                        except Exception as parse_err:
                            logger.warning(f"Failed to parse PDF from msg {msg_id}: {parse_err}")
                except Exception as msg_err:
                    logger.warning(f"Failed to fetch attachments for msg {msg_id}: {msg_err}")
                    

            session.commit()

            job.passes_found = passes_found
            job.passes_saved = passes_saved
            job.status = "completed"
            job.completed_at = datetime.now(timezone.utc)
            session.commit()

            return {
                "emails_scanned": len(message_ids),
                "passes_found": passes_found,
                "passes_saved": passes_saved,
            }

        except Exception as exc:
            logger.exception(f"Gmail sync failed for user {user_id}: {exc}")
            job.status = "failed"
            job.error_message = str(exc)[:500]
            job.completed_at = datetime.now(timezone.utc)
            session.commit()
            raise
