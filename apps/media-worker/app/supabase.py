from __future__ import annotations

import base64
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable
from urllib.parse import urljoin

import httpx

from .config import WorkerSettings

TUS_CHUNK_BYTES = 6 * 1024 * 1024


@dataclass(frozen=True)
class MediaJob:
    id: str
    user_id: str
    source_url: str
    output_format: str
    quality: str

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "MediaJob":
        return cls(
            id=str(payload["id"]),
            user_id=str(payload["user_id"]),
            source_url=str(payload["source_url"]),
            output_format=str(payload["output_format"]),
            quality=str(payload["quality"]),
        )


class SupabaseRepository:
    def __init__(self, settings: WorkerSettings):
        self.settings = settings
        timeout = httpx.Timeout(connect=30, read=120, write=120, pool=30)
        self.client = httpx.Client(timeout=timeout, follow_redirects=True)
        self.auth_headers = {
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
        }
        self.data_headers = {
            **self.auth_headers,
            "Accept-Profile": "jg_app",
            "Content-Profile": "jg_app",
            "Content-Type": "application/json",
        }

    def close(self) -> None:
        self.client.close()

    def _rpc(self, name: str) -> Any:
        response = self.client.post(
            f"{self.settings.supabase_url}/rest/v1/rpc/{name}",
            headers=self.data_headers,
            json={},
        )
        response.raise_for_status()
        return response.json()

    def requeue_stale_jobs(self) -> int:
        result = self._rpc("requeue_stale_media_conversion_jobs")
        return int(result or 0)

    def claim_job(self) -> MediaJob | None:
        rows = self._rpc("claim_media_conversion_job")
        if not rows:
            return None
        return MediaJob.from_payload(rows[0])

    def update_job(self, job_id: str, **fields: Any) -> None:
        response = self.client.patch(
            f"{self.settings.supabase_url}/rest/v1/media_conversion_jobs",
            headers={**self.data_headers, "Prefer": "return=minimal"},
            params={"id": f"eq.{job_id}"},
            json=fields,
        )
        response.raise_for_status()

    def claim_expired_job(self) -> tuple[str, str | None] | None:
        rows = self._rpc("claim_expired_media_conversion_job")
        if not rows:
            return None
        return str(rows[0]["job_id"]), rows[0].get("object_path")

    def delete_job(self, job_id: str) -> None:
        response = self.client.delete(
            f"{self.settings.supabase_url}/rest/v1/media_conversion_jobs",
            headers={**self.data_headers, "Prefer": "return=minimal"},
            params={"id": f"eq.{job_id}"},
        )
        response.raise_for_status()

    @staticmethod
    def _metadata(**values: str) -> str:
        return ",".join(
            f"{key} {base64.b64encode(value.encode()).decode()}"
            for key, value in values.items()
        )

    def upload_file(
        self,
        *,
        path: Path,
        object_path: str,
        content_type: str,
        progress_callback: Callable[[int], None],
    ) -> None:
        total_bytes = path.stat().st_size
        create_response = self.client.post(
            f"{self.settings.supabase_storage_url}/storage/v1/upload/resumable",
            headers={
                **self.auth_headers,
                "Tus-Resumable": "1.0.0",
                "Upload-Length": str(total_bytes),
                "Upload-Metadata": self._metadata(
                    bucketName=self.settings.storage_bucket,
                    objectName=object_path,
                    contentType=content_type,
                    cacheControl="300",
                ),
                "x-upsert": "false",
            },
        )
        create_response.raise_for_status()
        location = create_response.headers.get("location")
        if not location:
            raise RuntimeError("Supabase Storage did not return a TUS upload URL")
        upload_url = urljoin(str(create_response.url), location)

        offset = 0
        with path.open("rb") as handle:
            while offset < total_bytes:
                handle.seek(offset)
                chunk = handle.read(TUS_CHUNK_BYTES)
                if not chunk:
                    break

                for attempt in range(5):
                    try:
                        response = self.client.patch(
                            upload_url,
                            headers={
                                **self.auth_headers,
                                "Tus-Resumable": "1.0.0",
                                "Upload-Offset": str(offset),
                                "Content-Type": "application/offset+octet-stream",
                            },
                            content=chunk,
                        )
                        response.raise_for_status()
                        offset = int(
                            response.headers.get("upload-offset", offset + len(chunk))
                        )
                        break
                    except httpx.HTTPError:
                        if attempt == 4:
                            raise
                        time.sleep(2**attempt)
                        head = self.client.head(
                            upload_url,
                            headers={
                                **self.auth_headers,
                                "Tus-Resumable": "1.0.0",
                            },
                        )
                        head.raise_for_status()
                        remote_offset = int(head.headers.get("upload-offset", offset))
                        if remote_offset != offset:
                            offset = remote_offset
                            break

                progress_callback(round((offset / total_bytes) * 100))

        if offset != total_bytes:
            raise RuntimeError(
                "Supabase Storage upload ended before all bytes were sent"
            )

    def delete_storage_object(self, object_path: str) -> None:
        response = self.client.request(
            "DELETE",
            f"{self.settings.supabase_url}/storage/v1/object/{self.settings.storage_bucket}",
            headers={**self.auth_headers, "Content-Type": "application/json"},
            json={"prefixes": [object_path]},
        )
        response.raise_for_status()
