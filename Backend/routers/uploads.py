"""File upload endpoint (Supabase Storage)."""

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile

from core.auth import CurrentUser, get_current_user
from services import upload_service

router = APIRouter(prefix="/uploads", tags=["Uploads"])


@router.post("")
async def upload_file(
    user: Annotated[CurrentUser, Depends(get_current_user)],
    file: Annotated[UploadFile, File()],
    folder: Annotated[str, Form()] = "assets",
) -> dict:
    return await upload_service.upload(file, folder)
