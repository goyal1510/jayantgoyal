import { createToolReference } from "./create-tool-reference";
import type { ToolReferenceRegistry } from "./types";

export const mediaQrToolReferences = {
  "/tools/media-qr/qr-code-generator": createToolReference(
    "/tools/media-qr/qr-code-generator",
    {
      summary:
        "Generate a downloadable QR code for a URL or text value and adjust foreground and background colors for the intended placement.",
      useCases: [
        "Share a public link on printed material.",
        "Create a scannable test code for a product flow.",
      ],
      examples: [
        "Generate a QR code for a portfolio URL.",
        "Create a high-contrast code for a printed event card.",
      ],
      considerations:
        "Scan-test the final size, contrast, quiet zone, and destination. A QR code can hide a malicious or outdated URL, so show the destination nearby.",
    },
  ),
  "/tools/media-qr/wifi-qr-code-generator": createToolReference(
    "/tools/media-qr/wifi-qr-code-generator",
    {
      summary:
        "Create a QR code that lets compatible phones and tablets join a Wi-Fi network without manually typing its credentials.",
      useCases: [
        "Share a guest network in a home or office.",
        "Create a printable Wi-Fi onboarding card for an event.",
      ],
      examples: [
        "Generate a code for a WPA guest SSID.",
        "Download a QR image for a meeting-room sign.",
      ],
      considerations:
        "The QR payload can contain the network password. Treat the image as a credential, use a guest network where possible, and test compatibility before distributing it.",
    },
  ),
  "/tools/media-qr/svg-placeholder-generator": createToolReference(
    "/tools/media-qr/svg-placeholder-generator",
    {
      summary:
        "Generate lightweight SVG placeholders with chosen dimensions and presentation settings for layouts, prototypes, and loading states.",
      useCases: [
        "Reserve image dimensions during frontend development.",
        "Create predictable placeholder assets for documentation or fixtures.",
      ],
      examples: [
        "Generate a 16:9 placeholder for a card image.",
        "Create a square placeholder for an avatar slot.",
      ],
      considerations:
        "Use the same aspect ratio and approximate visual density as the final asset. Replace placeholders before production accessibility and performance review.",
    },
  ),
  "/tools/media-qr/camera-recorder": createToolReference(
    "/tools/media-qr/camera-recorder",
    {
      summary:
        "Capture a photo or record video from an available browser camera for local testing and media-flow prototypes.",
      useCases: [
        "Test camera permission and capture interfaces.",
        "Create a disposable sample for an upload or preview workflow.",
      ],
      examples: [
        "Take a test profile-photo capture.",
        "Record a short clip to check playback and download behavior.",
      ],
      considerations:
        "Camera use requires explicit permission and can expose personal surroundings. Confirm the selected device, recording indicator, retention, and destination before capturing sensitive media.",
    },
  ),
  "/tools/media-qr/media-converter": createToolReference(
    "/tools/media-qr/media-converter",
    {
      summary:
        "Create a temporary MP3 or MP4 from a YouTube video or Short you own or are explicitly authorized to download.",
      useCases: [
        "Extract an MP3 from a YouTube upload you own or are licensed to reuse.",
        "Create an MP4 copy of an authorized video or Short for an offline workflow.",
      ],
      examples: [
        "Turn your uploaded presentation recording into a 192 kbps MP3.",
        "Download an authorized Short as a temporary 720p MP4.",
      ],
      considerations:
        "Only submit media you own or have explicit permission to download. Jobs run on a private worker, outputs are stored in a user-scoped private bucket, links expire quickly, and files are automatically deleted.",
      faqs: [
        {
          question: "Why is the download not limited to 4.5 MB?",
          answer:
            "Studio sends only small job data. The worker uploads media directly to private object storage, and the browser downloads through a short-lived signed storage URL instead of a Vercel Function response.",
        },
        {
          question: "Can every account use this tool?",
          answer:
            "No. Production access fails closed and is limited to explicitly configured owner email addresses or Supabase user IDs.",
        },
      ],
    },
  ),
} satisfies ToolReferenceRegistry;
