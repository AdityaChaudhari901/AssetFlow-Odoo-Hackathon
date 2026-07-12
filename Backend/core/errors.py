"""Domain exception type mapped onto the stable API error envelope."""

from typing import Any, Optional

from fastapi import status


class ApiError(Exception):
    """Raise from services for any expected domain failure.

    The registered handler renders it as
    ``{"error": {"code", "message", "request_id", "details"}}``.
    """

    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: Optional[Any] = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details

    # ---- convenience constructors for the most common failures ----

    @classmethod
    def not_found(cls, entity: str = "Resource") -> "ApiError":
        return cls(status.HTTP_404_NOT_FOUND, "NOT_FOUND", f"{entity} not found.")

    @classmethod
    def forbidden(cls, message: str = "You do not have permission to do that.") -> "ApiError":
        return cls(status.HTTP_403_FORBIDDEN, "FORBIDDEN", message)

    @classmethod
    def conflict(cls, code: str, message: str, details: Optional[Any] = None) -> "ApiError":
        return cls(status.HTTP_409_CONFLICT, code, message, details)

    @classmethod
    def unauthorized(cls, code: str = "UNAUTHORIZED", message: str = "Authentication required.") -> "ApiError":
        return cls(status.HTTP_401_UNAUTHORIZED, code, message)
