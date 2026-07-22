from __future__ import annotations

import json
import re
import subprocess
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Callable
from urllib.parse import parse_qs, urlparse

ProgressCallback = Callable[[int, str], None]

YOUTUBE_HOSTS = {
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
}
VIDEO_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{6,32}$")
PROGRESS_PATTERN = re.compile(r"MEDIA_PROGRESS:\s*([0-9]+(?:\.[0-9]+)?)%")
TITLE_MARKER = "MEDIA_TITLE:"
PATH_MARKER = "MEDIA_PATH:"

QUALITY_HEIGHTS = {"small": 480, "balanced": 720, "high": 1080}
QUALITY_AUDIO_KBPS = {"small": 128, "balanced": 192, "high": 320}


@dataclass(frozen=True)
class SourceMetadata:
    title: str
    duration_seconds: int | None


@dataclass(frozen=True)
class ConversionResult:
    path: Path
    title: str
    output_filename: str
    mime_type: str


class MediaConversionError(RuntimeError):
    pass


def normalize_youtube_url(value: str) -> str:
    parsed = urlparse(value.strip())
    if parsed.scheme not in {"http", "https"}:
        raise MediaConversionError("Only HTTP or HTTPS YouTube links are allowed.")

    hostname = (parsed.hostname or "").lower()
    segments = [segment for segment in parsed.path.split("/") if segment]
    video_id: str | None = None

    if hostname == "youtu.be" and segments:
        video_id = segments[0]
    elif hostname in YOUTUBE_HOSTS:
        if segments[:1] == ["watch"]:
            video_id = parse_qs(parsed.query).get("v", [None])[0]
        elif segments[:1] in (["shorts"], ["live"]) and len(segments) > 1:
            video_id = segments[1]

    if not video_id or not VIDEO_ID_PATTERN.fullmatch(video_id):
        raise MediaConversionError("Enter a valid YouTube video or Shorts link.")
    return f"https://www.youtube.com/watch?v={video_id}"


def safe_output_name(title: str, extension: str) -> str:
    ascii_title = (
        unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode()
    )
    slug = re.sub(r"[^A-Za-z0-9._-]+", "-", ascii_title).strip("-._")[:100]
    return f"{slug or 'converted-media'}.{extension}"


def _base_args(cookie_file: Path | None) -> list[str]:
    args = [
        "yt-dlp",
        "--no-playlist",
        "--socket-timeout",
        "30",
        "--retries",
        "5",
        "--fragment-retries",
        "5",
    ]
    if cookie_file:
        args.extend(["--cookies", str(cookie_file)])
    return args


def build_probe_command(url: str, cookie_file: Path | None = None) -> list[str]:
    return [
        *_base_args(cookie_file),
        "--skip-download",
        "--dump-single-json",
        url,
    ]


def build_download_command(
    *,
    url: str,
    output_format: str,
    quality: str,
    workdir: Path,
    max_output_bytes: int,
    cookie_file: Path | None = None,
) -> list[str]:
    if output_format not in {"mp3", "mp4"}:
        raise MediaConversionError("Unsupported output format.")
    if quality not in QUALITY_HEIGHTS:
        raise MediaConversionError("Unsupported conversion quality.")

    args = [
        *_base_args(cookie_file),
        "--no-simulate",
        "--newline",
        "--progress",
        "--progress-template",
        "MEDIA_PROGRESS:%(progress._percent_str)s",
        "--print",
        f"before_dl:{TITLE_MARKER}%(title)s",
        "--print",
        f"after_move:{PATH_MARKER}%(filepath)s",
        "--concurrent-fragments",
        "4",
        "--max-filesize",
        str(max_output_bytes),
        "--paths",
        str(workdir),
        "--output",
        "source.%(ext)s",
    ]

    if output_format == "mp3":
        args.extend(
            [
                "--format",
                "bestaudio/best",
                "--extract-audio",
                "--audio-format",
                "mp3",
                "--audio-quality",
                f"{QUALITY_AUDIO_KBPS[quality]}K",
            ]
        )
    else:
        max_height = QUALITY_HEIGHTS[quality]
        format_selector = (
            f"bv*[height<={max_height}][vcodec^=avc1][ext=mp4]+"
            f"ba[acodec^=mp4a][ext=m4a]/b[height<={max_height}][ext=mp4]/"
            f"bv*[height<={max_height}]+ba/b[height<={max_height}]"
        )
        args.extend(
            [
                "--format",
                format_selector,
                "--merge-output-format",
                "mp4",
                "--remux-video",
                "mp4",
            ]
        )

    args.append(url)
    return args


def probe_source(
    url: str,
    *,
    max_duration_seconds: int,
    cookie_file: Path | None = None,
) -> SourceMetadata:
    normalized_url = normalize_youtube_url(url)
    process = subprocess.run(
        build_probe_command(normalized_url, cookie_file),
        check=False,
        capture_output=True,
        text=True,
        timeout=120,
    )
    if process.returncode != 0:
        detail = (process.stderr or process.stdout).strip().splitlines()[-1:]
        raise MediaConversionError(
            detail[0] if detail else "YouTube metadata could not be read."
        )

    try:
        info = json.loads(process.stdout)
    except json.JSONDecodeError as error:
        raise MediaConversionError(
            "YouTube returned invalid media metadata."
        ) from error

    if info.get("is_live") or info.get("live_status") in {"is_live", "is_upcoming"}:
        raise MediaConversionError("Live and upcoming streams are not supported.")

    duration = info.get("duration")
    duration_seconds = int(duration) if isinstance(duration, (int, float)) else None
    if duration_seconds and duration_seconds > max_duration_seconds:
        maximum_minutes = max_duration_seconds // 60
        raise MediaConversionError(
            f"This video is longer than the {maximum_minutes}-minute private-worker limit."
        )

    title = str(info.get("title") or "converted-media").strip()
    return SourceMetadata(title=title[:200], duration_seconds=duration_seconds)


def download_and_convert(
    *,
    url: str,
    output_format: str,
    quality: str,
    workdir: Path,
    max_output_bytes: int,
    metadata: SourceMetadata,
    progress_callback: ProgressCallback,
    cookie_file: Path | None = None,
) -> ConversionResult:
    command = build_download_command(
        url=normalize_youtube_url(url),
        output_format=output_format,
        quality=quality,
        workdir=workdir,
        max_output_bytes=max_output_bytes,
        cookie_file=cookie_file,
    )
    process = subprocess.Popen(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )

    output_path: Path | None = None
    recent_lines: list[str] = []
    assert process.stdout is not None
    for raw_line in process.stdout:
        line = raw_line.strip()
        if not line:
            continue
        recent_lines.append(line)
        recent_lines = recent_lines[-12:]

        progress_match = PROGRESS_PATTERN.search(line)
        if progress_match:
            percent = min(max(int(float(progress_match.group(1))), 0), 100)
            progress_callback(percent, "Downloading media")
        elif line.startswith(PATH_MARKER):
            output_path = Path(line.removeprefix(PATH_MARKER).strip())
        elif "Post-process" in line or "ExtractAudio" in line or "Merger" in line:
            progress_callback(100, "Converting media")

    return_code = process.wait()
    if return_code != 0:
        error_line = next(
            (line for line in reversed(recent_lines) if "ERROR:" in line),
            recent_lines[-1] if recent_lines else "Media conversion failed.",
        )
        raise MediaConversionError(error_line.removeprefix("ERROR:").strip())

    if output_path is None or not output_path.exists():
        candidates = sorted(workdir.glob(f"*.{output_format}"))
        output_path = candidates[-1] if candidates else None
    if output_path is None or not output_path.is_file():
        raise MediaConversionError("The converter did not produce an output file.")
    if not output_path.resolve().is_relative_to(workdir.resolve()):
        raise MediaConversionError("The converter returned an unsafe output path.")
    if output_path.stat().st_size > max_output_bytes:
        raise MediaConversionError(
            "The converted file exceeds the configured size limit."
        )

    output_filename = safe_output_name(metadata.title, output_format)
    mime_type = "audio/mpeg" if output_format == "mp3" else "video/mp4"
    return ConversionResult(
        path=output_path,
        title=metadata.title,
        output_filename=output_filename,
        mime_type=mime_type,
    )
