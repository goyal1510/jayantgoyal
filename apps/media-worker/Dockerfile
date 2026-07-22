FROM denoland/deno:bin-2.3.7 AS deno

FROM python:3.12.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update \
    && apt-get install --yes --no-install-recommends ca-certificates ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deno /deno /usr/local/bin/deno

WORKDIR /app
COPY requirements.txt ./
RUN python -m pip install --requirement requirements.txt

RUN useradd --create-home --uid 1000 worker
COPY --chown=worker:worker app ./app
USER worker

EXPOSE 8080
CMD ["python", "-m", "app.main"]
