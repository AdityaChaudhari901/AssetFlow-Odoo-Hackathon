"""Request bodies for /categories endpoints."""

from typing import Literal, Optional

from pydantic import BaseModel, Field


class CustomFieldDef(BaseModel):
    key: str = Field(min_length=1, max_length=60, pattern=r"^[a-z][a-z0-9_]*$")
    label: str = Field(min_length=1, max_length=120)
    type: Literal["text", "number", "date", "boolean"]
    required: bool = False


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = None
    custom_fields: list[CustomFieldDef] = []


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = None
    custom_fields: Optional[list[CustomFieldDef]] = None
    status: Optional[Literal["active", "inactive"]] = None
