"""Focused tests for the optimized refresh-session response."""

from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import patch

from core.errors import ApiError
from services import auth_service


def _session(user_id: str) -> SimpleNamespace:
    user = SimpleNamespace(id=user_id)
    return SimpleNamespace(
        access_token="access-token",
        refresh_token="rotated-refresh-token",
        expires_at=1_800_000_000,
        user=user,
    )


def _profile(user_id: str, status: str = "active") -> dict:
    return {
        "id": user_id,
        "full_name": "AssetFlow Admin",
        "email": "admin@example.com",
        "role": "admin",
        "department_id": None,
        "department": None,
        "status": status,
        "avatar_url": None,
        "created_at": "2026-07-15T00:00:00Z",
    }


class RefreshSessionTests(TestCase):
    @patch("services.auth_service.fetch_profile")
    @patch("services.auth_service.get_auth_client")
    def test_refresh_returns_session_and_profile(self, get_auth_client, fetch_profile):
        user_id = "11111111-1111-1111-1111-111111111111"
        session = _session(user_id)
        get_auth_client.return_value.auth.refresh_session.return_value = SimpleNamespace(
            user=session.user,
            session=session,
        )
        fetch_profile.return_value = _profile(user_id)

        result = auth_service.refresh("refresh-token")

        self.assertEqual(result["data"]["session"]["access_token"], "access-token")
        self.assertEqual(result["data"]["user"]["id"], user_id)
        self.assertEqual(result["data"]["user"]["role"], "admin")
        fetch_profile.assert_called_once_with(user_id)

    @patch("services.auth_service.fetch_profile")
    @patch("services.auth_service.get_auth_client")
    def test_refresh_rejects_inactive_profile(self, get_auth_client, fetch_profile):
        user_id = "22222222-2222-2222-2222-222222222222"
        session = _session(user_id)
        get_auth_client.return_value.auth.refresh_session.return_value = SimpleNamespace(
            user=session.user,
            session=session,
        )
        fetch_profile.return_value = _profile(user_id, status="inactive")

        with self.assertRaises(ApiError) as raised:
            auth_service.refresh("refresh-token")

        self.assertEqual(raised.exception.status_code, 403)
        self.assertEqual(raised.exception.code, "ACCOUNT_INACTIVE")
