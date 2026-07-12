"""Shared Supabase clients for backend services.

Two clients, two jobs:

* ``get_auth_client``    — publishable key; ONLY for Supabase Auth calls
  (signup/login/refresh/password flows). Never used for table access.
* ``get_service_client`` — secret (service-role) key; ALL table/storage access.
  It bypasses RLS, so the API layer is the sole authorization surface.

Never attach an end-user session to either shared client.
"""

from functools import lru_cache

from supabase import Client, ClientOptions, create_client

from config.settings import get_settings


def _client(key: str) -> Client:
    settings = get_settings()
    return create_client(
        str(settings.supabase_url).rstrip("/"),
        key,
        options=ClientOptions(auto_refresh_token=False, persist_session=False),
    )


@lru_cache(maxsize=1)
def get_auth_client() -> Client:
    """Low-privilege client used exclusively to proxy Supabase Auth."""
    return _client(get_settings().supabase_publishable_key.get_secret_value())


@lru_cache(maxsize=1)
def get_service_client() -> Client:
    """Service-role client for all data and storage access (bypasses RLS)."""
    return _client(get_settings().supabase_secret_key.get_secret_value())


# Backwards-compatible alias for the original scaffold import.
get_supabase_client = get_auth_client
