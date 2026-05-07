import base64
import logging
from typing import Optional
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from app.core.settings import get_settings

logger = logging.getLogger(__name__)

GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]


class GmailService:
    def __init__(self, refresh_token: str):
        settings = get_settings()
        self._creds = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.google_client_id,
            client_secret=settings.google_client_secret,
            scopes=GMAIL_SCOPES,
        )
        self._service = None

    def _get_service(self):
        if self._service is None:
            self._service = build("gmail", "v1", credentials=self._creds, cache_discovery=False)
        return self._service

    def search_messages(self, query: str, max_results: int = 100) -> list[str]:
        service = self._get_service()
        message_ids: list[str] = []
        page_token: Optional[str] = None

        while len(message_ids) < max_results:
            batch = min(50, max_results - len(message_ids))
            kwargs: dict = {"userId": "me", "q": query, "maxResults": batch}
            if page_token:
                kwargs["pageToken"] = page_token

            result = service.users().messages().list(**kwargs).execute()
            message_ids.extend(m["id"] for m in result.get("messages", []))
            page_token = result.get("nextPageToken")
            if not page_token:
                break

        return message_ids

    def get_pdf_attachments(self, message_id: str) -> list[tuple[str, bytes]]:
        """Returns list of (filename, pdf_bytes) tuples for all PDF parts in the message."""
        service = self._get_service()
        msg = service.users().messages().get(userId="me", id=message_id, format="full").execute()
        results: list[tuple[str, bytes]] = []

        def _walk_parts(parts: list) -> None:
            for part in parts:
                mime = part.get("mimeType", "")
                if mime == "application/pdf" or (mime == "application/octet-stream" and part.get("filename", "").lower().endswith(".pdf")):
                    body = part.get("body", {})
                    attachment_id = body.get("attachmentId")
                    if attachment_id:
                        att = service.users().messages().attachments().get(
                            userId="me", messageId=message_id, id=attachment_id
                        ).execute()
                        pdf_bytes = base64.urlsafe_b64decode(att["data"])
                        results.append((part.get("filename", "boarding_pass.pdf"), pdf_bytes))
                    elif body.get("data"):
                        pdf_bytes = base64.urlsafe_b64decode(body["data"])
                        results.append((part.get("filename", "boarding_pass.pdf"), pdf_bytes))
                if part.get("parts"):
                    _walk_parts(part["parts"])

        payload = msg.get("payload", {})
        if payload.get("parts"):
            _walk_parts(payload["parts"])

        return results
