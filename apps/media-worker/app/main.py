from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI

from .config import WorkerSettings
from .worker import MediaWorker

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

settings = WorkerSettings.from_env()
worker = MediaWorker(settings)


@asynccontextmanager
async def lifespan(_: FastAPI):
    worker.start()
    try:
        yield
    finally:
        worker.stop()


app = FastAPI(
    title="JG Private Media Worker",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
    lifespan=lifespan,
)


@app.get("/healthz")
def healthz() -> dict[str, str | bool | None]:
    status = "starting"
    if worker.is_alive:
        status = "degraded" if worker.is_degraded else "ok"
    return {
        "status": status,
        "workerAlive": worker.is_alive,
        "lastActivityAt": (
            worker.last_activity_at.isoformat() if worker.last_activity_at else None
        ),
        "lastSuccessfulPollAt": (
            worker.last_successful_poll_at.isoformat()
            if worker.last_successful_poll_at
            else None
        ),
    }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8080")),
    )
