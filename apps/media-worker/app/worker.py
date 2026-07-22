from __future__ import annotations

import logging
import tempfile
import threading
from datetime import UTC, datetime, timedelta
from pathlib import Path

from .config import WorkerSettings
from .media import MediaConversionError, download_and_convert, probe_source
from .supabase import MediaJob, SupabaseRepository

logger = logging.getLogger(__name__)


def utc_now() -> datetime:
    return datetime.now(UTC)


class MediaWorker:
    def __init__(self, settings: WorkerSettings):
        self.settings = settings
        self.cookie_file = settings.materialize_cookie_file()
        self.stop_event = threading.Event()
        self.thread: threading.Thread | None = None
        self.last_activity_at: datetime | None = None
        self.last_successful_poll_at: datetime | None = None
        self.is_degraded = False

    @property
    def is_alive(self) -> bool:
        return bool(self.thread and self.thread.is_alive())

    def start(self) -> None:
        if self.is_alive:
            return
        self.thread = threading.Thread(
            target=self._run_forever,
            name="media-conversion-worker",
            daemon=True,
        )
        self.thread.start()

    def stop(self) -> None:
        self.stop_event.set()
        if self.thread:
            self.thread.join(timeout=15)

    def _run_forever(self) -> None:
        repository = SupabaseRepository(self.settings)
        requeue_attempted = False
        try:
            while not self.stop_event.is_set():
                self.last_activity_at = utc_now()
                try:
                    if not requeue_attempted:
                        requeued = repository.requeue_stale_jobs()
                        requeue_attempted = True
                        if requeued:
                            logger.warning(
                                "Requeued %s stale media conversion job(s)", requeued
                            )
                    self._cleanup_one(repository)
                    job = repository.claim_job()
                    self.last_successful_poll_at = utc_now()
                    self.is_degraded = False
                    if job:
                        self._process_job(repository, job)
                        continue
                except Exception:
                    self.is_degraded = True
                    logger.exception("Media worker polling cycle failed")

                self.stop_event.wait(self.settings.poll_interval_seconds)
        finally:
            repository.close()

    def _cleanup_one(self, repository: SupabaseRepository) -> None:
        expired = repository.claim_expired_job()
        if not expired:
            return
        job_id, object_path = expired
        if object_path:
            repository.delete_storage_object(object_path)
        repository.delete_job(job_id)
        logger.info("Deleted expired media conversion job %s", job_id)

    def _process_job(self, repository: SupabaseRepository, job: MediaJob) -> None:
        logger.info("Processing media conversion job %s", job.id)
        last_progress = 0

        def update_download_progress(percent: int, phase: str) -> None:
            nonlocal last_progress
            mapped = min(70, 5 + round(percent * 0.65))
            if mapped < last_progress + 3 and percent < 100:
                return
            last_progress = mapped
            repository.update_job(
                job.id,
                status="converting" if phase == "Converting media" else "downloading",
                progress=mapped,
            )

        try:
            metadata = probe_source(
                job.source_url,
                max_duration_seconds=self.settings.max_duration_seconds,
                cookie_file=self.cookie_file,
            )
            repository.update_job(job.id, title=metadata.title, progress=5)

            with tempfile.TemporaryDirectory(prefix=f"media-{job.id}-") as directory:
                result = download_and_convert(
                    url=job.source_url,
                    output_format=job.output_format,
                    quality=job.quality,
                    workdir=Path(directory),
                    max_output_bytes=self.settings.max_output_bytes,
                    metadata=metadata,
                    progress_callback=update_download_progress,
                    cookie_file=self.cookie_file,
                )
                object_path = f"{job.user_id}/{job.id}/{result.output_filename}"
                size_bytes = result.path.stat().st_size
                repository.update_job(
                    job.id,
                    status="uploading",
                    progress=82,
                    title=result.title,
                    output_filename=result.output_filename,
                    mime_type=result.mime_type,
                    size_bytes=size_bytes,
                    storage_path=object_path,
                )

                repository.upload_file(
                    path=result.path,
                    object_path=object_path,
                    content_type=result.mime_type,
                    progress_callback=lambda percent: repository.update_job(
                        job.id,
                        status="uploading",
                        progress=min(99, 82 + round(percent * 0.17)),
                    ),
                )

            completed_at = utc_now()
            repository.update_job(
                job.id,
                status="completed",
                progress=100,
                completed_at=completed_at.isoformat(),
                expires_at=(
                    completed_at + timedelta(minutes=self.settings.retention_minutes)
                ).isoformat(),
                error_message=None,
            )
            logger.info("Completed media conversion job %s", job.id)
        except Exception as error:
            if isinstance(error, MediaConversionError):
                message = str(error)
            else:
                logger.exception("Media conversion job %s failed", job.id)
                message = "The private worker could not complete this conversion."
            repository.update_job(
                job.id,
                status="failed",
                progress=0,
                error_message=message[:500],
                completed_at=utc_now().isoformat(),
            )
