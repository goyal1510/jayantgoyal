# Media Lab

Media Lab is a private Studio utility group, separate from the public Tech Tools catalog.

## Navigation

```text
Utilities
└── Media Lab
    └── YouTube Converter
```

The YouTube Converter lives at `/media-lab/youtube-converter`. It accepts an
authorized YouTube video or Shorts URL, creates an MP3 or MP4 job, and exposes a
temporary signed download after the private worker finishes processing.

## Architecture

- Studio authenticates the owner and creates user-scoped queue records.
- The Back4App worker polls Supabase and runs `yt-dlp` plus FFmpeg.
- Output is uploaded directly to the private `media-converter-output` bucket.
- Studio returns only short-lived signed download URLs; large files do not pass
  through a Vercel Function response.

Internal database, bucket, environment-variable, and worker names retain the
generic `media-converter` terminology because they are shared infrastructure,
not user-facing Tech Tools navigation.
