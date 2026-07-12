"""Shared Supabase client for backend services."""

from functools import lru_cache

from supabase import Client, ClientOptions, create_client

from config.settings import get_settings


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """Return the low-privilege client backed by the publishable project key.

    Never attach an end-user session to this shared client. Authenticated clients
    must be request-scoped when the authentication flow is implemented.
    """
    settings = get_settings()
    return create_client(
        str(settings.supabase_url).rstrip("/"),
        settings.supabase_publishable_key.get_secret_value(),
        options=ClientOptions(auto_refresh_token=False, persist_session=False),
    )
