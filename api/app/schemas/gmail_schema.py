from typing import Optional
from pydantic import BaseModel


class GmailSyncEnqueueResponse(BaseModel):
    job_id: str
    task_id: Optional[str]
    status: str = "pending"


class GmailSyncStatusResponse(BaseModel):
    status: str                       # pending|running|completed|failed|idle
    emails_scanned: int = 0
    passes_found: int = 0
    passes_saved: int = 0
    last_synced_at: Optional[str] = None
    error: Optional[str] = None
