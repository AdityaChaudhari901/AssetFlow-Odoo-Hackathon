"""File uploads to Supabase Storage (public bucket)."""

import uuid
from pathlib import PurePosixPath
from typing import Any

from fastapi import UploadFile

from config.settings import get_settings
from core.errors import ApiError
from database.supabase import get_service_client

MAX_BYTES = 5 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
ALLOWED_FOLDERS = {"assets", "maintenance", "avatars"}


async def upload(file: UploadFile, folder: str) -> dict[str, Any]:
    if folder not in ALLOWED_FOLDERS:
        raise ApiError(400, "VALIDATION_ERROR", f"folder must be one of {sorted(ALLOWED_FOLDERS)}.")
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise ApiError(400, "VALIDATION_ERROR", "Only JPEG, PNG, WebP images or PDFs are allowed.")

    content = await file.read()
    if len(content) > MAX_BYTES:
        raise ApiError(400, "VALIDATION_ERROR", "File is larger than 5 MB.")

    suffix = PurePosixPath(file.filename or "").suffix.lower() or ".bin"
    path = f"{folder}/{uuid.uuid4().hex}{suffix}"
    bucket = get_settings().storage_bucket
    storage = get_service_client().storage.from_(bucket)
    storage.upload(path, content, {"content-type": file.content_type})
    url = storage.get_public_url(path)
    return {"data": {"url": url, "path": path}}
