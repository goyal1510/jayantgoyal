from __future__ import annotations

import base64
import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse


def _required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def _bounded_int(name: str, default: int, minimum: int, maximum: int) -> int:
    raw = os.getenv(name, str(default)).strip()
    try:
        value = int(raw)
    except ValueError as error:
        raise RuntimeError(f"{name} must be an integer") from error
    return min(max(value, minimum), maximum)


@dataclass(frozen=True)
class WorkerSettings:
    supabase_url: str
    supabase_service_role_key: str
    supabase_storage_url: str
    storage_bucket: str
    poll_interval_seconds: int
    retention_minutes: int
    max_duration_seconds: int
    max_output_bytes: int
    youtube_cookies_base64: str | None

    @classmethod
    def from_env(cls) -> "WorkerSettings":
        supabase_url = _required("SUPABASE_URL").rstrip("/")
        parsed = urlparse(supabase_url)
        project_ref = parsed.hostname.split(".")[0] if parsed.hostname else ""
        if not project_ref:
            raise RuntimeError("SUPABASE_URL must contain a project hostname")

        storage_url = os.getenv("SUPABASE_STORAGE_URL", "").strip().rstrip("/")
        if not storage_url:
            storage_url = f"https://{project_ref}.storage.supabase.co"

        return cls(
            supabase_url=supabase_url,
            supabase_service_role_key=_required("SUPABASE_SERVICE_ROLE_KEY"),
            supabase_storage_url=storage_url,
            storage_bucket=os.getenv(
                "MEDIA_STORAGE_BUCKET", "media-converter-output"
            ).strip(),
            poll_interval_seconds=_bounded_int("MEDIA_POLL_SECONDS", 3, 1, 60),
            retention_minutes=_bounded_int("MEDIA_RETENTION_MINUTES", 60, 10, 24 * 60),
            max_duration_seconds=_bounded_int(
                "MEDIA_MAX_DURATION_SECONDS", 2 * 60 * 60, 60, 12 * 60 * 60
            ),
            max_output_bytes=_bounded_int(
                "MEDIA_MAX_OUTPUT_BYTES",
                500 * 1024 * 1024,
                1024 * 1024,
                512 * 1024 * 1024,
            ),
            youtube_cookies_base64=os.getenv("YOUTUBE_COOKIES_BASE64") or None,
        )

    def materialize_cookie_file(self) -> Path | None:
        if not self.youtube_cookies_base64:
            return None

        try:
            content = base64.b64decode(self.youtube_cookies_base64, validate=True)
        except (ValueError, base64.binascii.Error) as error:
            raise RuntimeError("YOUTUBE_COOKIES_BASE64 is not valid base64") from error

        path = Path("/tmp/media-worker-youtube-cookies.txt")
        path.write_bytes(content)
        path.chmod(0o600)
        return path
