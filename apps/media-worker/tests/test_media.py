from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase

from app.media import (
    MediaConversionError,
    build_download_command,
    normalize_youtube_url,
    safe_output_name,
)


class MediaTests(TestCase):
    def test_normalizes_supported_youtube_links(self) -> None:
        canonical = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        self.assertEqual(normalize_youtube_url(canonical), canonical)
        self.assertEqual(
            normalize_youtube_url("https://youtu.be/dQw4w9WgXcQ?t=10"), canonical
        )
        self.assertEqual(
            normalize_youtube_url("https://youtube.com/shorts/dQw4w9WgXcQ"),
            canonical,
        )

    def test_rejects_non_youtube_and_deceptive_hosts(self) -> None:
        for url in (
            "https://example.com/video",
            "https://youtube.com.example.com/watch?v=dQw4w9WgXcQ",
            "file:///tmp/video.mp4",
        ):
            with self.assertRaises(MediaConversionError):
                normalize_youtube_url(url)

    def test_builds_bounded_mp3_and_mp4_commands(self) -> None:
        with TemporaryDirectory() as directory:
            common = {
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "workdir": Path(directory),
                "max_output_bytes": 50_000_000,
            }
            mp3 = build_download_command(
                **common, output_format="mp3", quality="balanced"
            )
            mp4 = build_download_command(**common, output_format="mp4", quality="high")

        self.assertIn("192K", mp3)
        self.assertIn("--extract-audio", mp3)
        self.assertIn("--merge-output-format", mp4)
        self.assertTrue(any("height<=1080" in argument for argument in mp4))
        self.assertIn("50000000", mp4)

    def test_creates_storage_safe_download_names(self) -> None:
        self.assertEqual(safe_output_name("My café / demo!", "mp3"), "My-cafe-demo.mp3")
        self.assertEqual(safe_output_name("✨", "mp4"), "converted-media.mp4")
