import { createToolReference } from "./create-tool-reference";
import type { ToolReferenceRegistry } from "./types";

export const otherToolReferences = {
  "/tools/other/device-information": createToolReference(
    "/tools/other/device-information",
    {
      summary:
        "Inspect browser-reported device, viewport, display, platform, and user-agent details while diagnosing responsive layouts and compatibility issues.",
      useCases: [
        "Capture the environment details behind a browser-specific UI issue.",
        "Check viewport, pixel-ratio, and user-agent values during responsive testing.",
      ],
      examples: [
        "Compare the reported screen size with the active browser viewport.",
        "Copy a user-agent value into a compatibility bug report.",
      ],
      considerations:
        "Browser-reported values can be reduced, spoofed, or affected by privacy settings and zoom. Treat them as diagnostic hints rather than reliable device identity or fingerprinting data.",
    },
  ),
  "/tools/other/basic-auth-generator": createToolReference(
    "/tools/other/basic-auth-generator",
    {
      summary:
        "Build an HTTP Basic Authorization header by combining a username and password in the standard Base64-encoded credential format.",
      useCases: [
        "Create a header for testing a development endpoint that uses HTTP Basic authentication.",
        "Verify how a client library formats a Basic Authorization value.",
      ],
      examples: [
        "Generate a header for a disposable local API account.",
        "Compare the output with a request captured in development tools.",
      ],
      considerations:
        "Base64 is encoding, not encryption. Use HTTPS, avoid real production credentials in untrusted tools, and prefer stronger authentication schemes where possible.",
    },
  ),
  "/tools/other/open-graph-generator": createToolReference(
    "/tools/other/open-graph-generator",
    {
      summary:
        "Generate Open Graph and social metadata for a web page so shared links can present a useful title, description, image, and canonical URL.",
      useCases: [
        "Draft social metadata for a new landing page or article.",
        "Review the required tags before adding them to a page head.",
      ],
      examples: [
        "Create Open Graph tags for a product launch page.",
        "Generate social title, description, and image markup for a blog post.",
      ],
      considerations:
        "Use absolute public URLs, accessible image assets, accurate content, and platform-supported dimensions. Validate the deployed page because social crawlers cache previews and may interpret tags differently.",
    },
  ),
  "/tools/other/mime-types": createToolReference("/tools/other/mime-types", {
    summary:
      "Look up common MIME media types and related file extensions when configuring uploads, responses, validation, or content handling.",
    useCases: [
      "Find an expected Content-Type value for an HTTP response.",
      "Check which common extensions are associated with a media type.",
    ],
    examples: [
      "Look up the MIME type normally used for a WebP image.",
      "Find common extensions associated with application/json.",
    ],
    considerations:
      "An extension does not prove a file's real format. Use authoritative registries where required and validate content independently instead of relying only on MIME type, extension, or browser sniffing.",
  }),
  "/tools/other/html-wysiwyg-editor": createToolReference(
    "/tools/other/html-wysiwyg-editor",
    {
      summary:
        "Compose formatted content visually while reviewing the generated HTML source for prototypes, email drafts, and content-management workflows.",
      useCases: [
        "Draft a formatted content block without writing every HTML tag manually.",
        "Inspect how visual formatting translates into editable markup.",
      ],
      examples: [
        "Create a heading, paragraph, list, and link for a CMS draft.",
        "Prepare a simple formatted block before moving it into an email template.",
      ],
      considerations:
        "Sanitize untrusted or user-generated HTML before rendering it. Review accessibility, semantic structure, inline styles, email-client support, and script or event-handler risks before publishing.",
    },
  ),
  "/tools/other/outlook-safelink-decoder": createToolReference(
    "/tools/other/outlook-safelink-decoder",
    {
      summary:
        "Extract the original destination encoded inside a Microsoft Outlook Safe Links URL for inspection, troubleshooting, or link auditing.",
      useCases: [
        "Inspect the destination behind a rewritten email link before sharing it.",
        "Compare a Safe Links URL with the source link expected by an application.",
      ],
      examples: [
        "Decode a copied Safe Links address from a test email.",
        "Recover the original URL while debugging an email-link redirect chain.",
      ],
      considerations:
        "Decoding does not make a destination safe. Treat unexpected output as potentially malicious, inspect the hostname carefully, and do not open suspicious links or expose sensitive query parameters.",
    },
  ),
  "/tools/other/json-to-csv": createToolReference("/tools/other/json-to-csv", {
    summary:
      "Convert structured JSON records into CSV rows with derived column headers for spreadsheet import, data review, and lightweight exports.",
    useCases: [
      "Turn an array of API records into a spreadsheet-ready table.",
      "Create a quick CSV export from uniform JSON objects.",
    ],
    examples: [
      "Convert customer fixture records into a CSV for local review.",
      "Export a list of objects with name, status, and timestamp columns.",
    ],
    considerations:
      "Decide how nested objects, arrays, null values, delimiters, quotes, line breaks, encodings, and spreadsheet-formula prefixes should be handled before using the output in a production workflow.",
  }),
  "/tools/other/markdown-to-html": createToolReference(
    "/tools/other/markdown-to-html",
    {
      summary:
        "Convert Markdown into rendered HTML for documentation previews, content migration, publishing drafts, and printable output.",
      useCases: [
        "Preview how a Markdown document will render before publishing.",
        "Generate HTML from a README or article draft for another system.",
      ],
      examples: [
        "Convert headings, lists, links, and code blocks from a Markdown note.",
        "Prepare printable HTML from a short documentation page.",
      ],
      considerations:
        "Markdown dialects differ, and raw HTML may be permitted by some parsers. Sanitize untrusted input and review links, code highlighting, tables, accessibility, and print styles before publishing.",
    },
  ),
  "/tools/other/url-encoder-decoder": createToolReference(
    "/tools/other/url-encoder-decoder",
    {
      summary:
        "Percent-encode text for use in URL components or decode an encoded value while inspecting query parameters, paths, redirects, and API requests.",
      useCases: [
        "Encode a query-parameter value that contains spaces or reserved characters.",
        "Decode a copied URL fragment while debugging a redirect or request.",
      ],
      examples: [
        "Encode a search phrase before adding it to a query string.",
        "Decode percent-encoded characters from a callback URL.",
      ],
      considerations:
        "Encode the correct component rather than an entire URL indiscriminately. Avoid double encoding, preserve intended delimiters, and validate decoded redirects before opening them.",
    },
  ),
  "/tools/other/html-entities": createToolReference(
    "/tools/other/html-entities",
    {
      summary:
        "Escape special characters into HTML entities or decode entities back into readable text when preparing or inspecting markup.",
      useCases: [
        "Display literal markup characters inside HTML text content.",
        "Decode an entity-heavy snippet while reviewing generated content.",
      ],
      examples: [
        "Escape angle brackets and ampersands in a documentation example.",
        "Decode &amp; and &quot; values from an HTML fragment.",
      ],
      considerations:
        "Escaping is context-specific and is not a complete sanitizer. HTML text, attributes, URLs, CSS, and JavaScript require different defenses against injection.",
    },
  ),
  "/tools/other/benchmark-builder": createToolReference(
    "/tools/other/benchmark-builder",
    {
      summary:
        "Compare the browser execution time of small JavaScript tasks using repeatable snippets and multiple runs for quick relative performance checks.",
      useCases: [
        "Compare two implementations of a small transformation.",
        "Observe whether a code change affects a repeatable browser-side task.",
      ],
      examples: [
        "Compare two ways to iterate over the same fixture array.",
        "Measure relative execution time before and after a local optimization.",
      ],
      considerations:
        "Browser benchmarks are affected by warm-up, just-in-time compilation, background work, throttling, fixtures, and sample size. Use representative data and dedicated profilers for consequential performance decisions.",
    },
  ),
  "/tools/other/emoji-picker": createToolReference(
    "/tools/other/emoji-picker",
    {
      summary:
        "Browse and copy emoji characters while inspecting their Unicode code points for interface copy, documentation, and text-processing tests.",
      useCases: [
        "Find and copy an emoji for a message or lightweight interface label.",
        "Inspect code points while testing Unicode-aware text handling.",
      ],
      examples: [
        "Copy a status emoji into a project note.",
        "Compare the code points of a single emoji and a joined emoji sequence.",
      ],
      considerations:
        "Emoji rendering varies by operating system, font, skin-tone modifier, variation selector, and joined grapheme sequence. Test visual and text-handling behavior on target platforms.",
    },
  ),
  "/tools/other/personal-information-form": createToolReference(
    "/tools/other/personal-information-form",
    {
      summary:
        "Enter and review common personal-information fields while prototyping forms, validation rules, and structured profile-data workflows.",
      useCases: [
        "Test how a profile form handles names, dates, phone numbers, age, and gender fields.",
        "Create disposable sample data for a local form demonstration.",
      ],
      examples: [
        "Check date-of-birth and derived-age behavior with fictional data.",
        "Review how optional demographic fields appear in a prototype.",
      ],
      considerations:
        "Use fictional data unless the environment and privacy policy explicitly support real personal information. Minimize collected fields, secure storage and transmission, and handle consent, retention, access, and deletion requirements.",
    },
  ),
} satisfies ToolReferenceRegistry;
