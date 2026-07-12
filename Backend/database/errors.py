"""Map Postgres/PostgREST failures onto stable API error codes.

Our RPC functions raise ``exception 'SOME_CODE'`` so the exception *message*
carries the domain code; constraint violations arrive as SQLSTATE codes
(23505 unique, 23P01 exclusion). Services call :func:`map_db_error` inside an
``except APIError`` block, optionally enriching specific codes first.
"""

from postgrest.exceptions import APIError as PostgrestError

from core.errors import ApiError

UNIQUE_VIOLATION = "23505"
EXCLUSION_VIOLATION = "23P01"

# error-code string raised by RPCs -> (HTTP status, API code, message)
_RPC_ERRORS = {
    "ASSET_NOT_FOUND": (404, "NOT_FOUND", "Asset not found."),
    "NOT_FOUND": (404, "NOT_FOUND", "Resource not found."),
    "ASSET_NOT_AVAILABLE": (409, "ASSET_NOT_AVAILABLE", "This asset is not available."),
    "ALREADY_PROCESSED": (409, "ALREADY_PROCESSED", "This item has already been processed."),
    "AUDIT_CYCLE_CLOSED": (409, "AUDIT_CYCLE_CLOSED", "This audit cycle is closed."),
}


def rpc_error_code(exc: PostgrestError) -> str | None:
    """Return the domain code embedded in an RPC ``raise exception`` message."""
    message = (exc.message or "").strip()
    for code in _RPC_ERRORS:
        if code in message:
            return code
    return None


def map_db_error(exc: PostgrestError) -> ApiError:
    """Best-effort translation of a PostgREST error into an ApiError."""
    code = rpc_error_code(exc)
    if code is not None:
        http_status, api_code, message = _RPC_ERRORS[code]
        return ApiError(http_status, api_code, message)
    if exc.code == UNIQUE_VIOLATION:
        return ApiError.conflict("DUPLICATE_RESOURCE", "A resource with these details already exists.")
    if exc.code == EXCLUSION_VIOLATION:
        return ApiError.conflict("BOOKING_OVERLAP", "The requested time slot overlaps an existing booking.")
    return ApiError(500, "INTERNAL_SERVER_ERROR", "A database error occurred.")
