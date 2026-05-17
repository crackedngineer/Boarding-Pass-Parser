import asyncio
import logging
import re
import uuid as uuid_lib
from typing import Optional

from app.db.supabase import get_supabase_service_client

logger = logging.getLogger(__name__)


def _storage_path(user_id: str, filename: str) -> str:
    safe = re.sub(r"[^\w\-.]", "_", filename)[:100]
    return f"{user_id}/{uuid_lib.uuid4()}_{safe}"


def upload_boarding_pass_pdf_sync(
    pdf_bytes: bytes,
    user_id: str,
    filename: str,
    bucket: str,
) -> Optional[str]:
    try:
        client = get_supabase_service_client()
        path = _storage_path(user_id, filename)
        client.storage.from_(bucket).upload(
            path=path,
            file=pdf_bytes,
            file_options={"content-type": "application/pdf"},
        )
        return client.storage.from_(bucket).get_public_url(path)
    except Exception as exc:
        logger.warning("Storage upload failed for user %s: %s", user_id, exc)
        return None


async def upload_boarding_pass_pdf(
    pdf_bytes: bytes,
    user_id: str,
    filename: str,
    bucket: str,
) -> Optional[str]:
    return await asyncio.to_thread(
        upload_boarding_pass_pdf_sync, pdf_bytes, user_id, filename, bucket
    )
