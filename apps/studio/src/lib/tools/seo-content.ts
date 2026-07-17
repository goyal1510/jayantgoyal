export type ToolFaq = {
  question: string
  answer: string
}

export type ToolSeoContent = {
  summary: string
  useCases: string[]
  examples: string[]
  faqs: ToolFaq[]
}

export const toolSeoContentByPath: Record<string, ToolSeoContent> = {
  "/tools/generators/uuid-generator": {
    summary:
      "Use the UUID generator when you need a unique identifier for database rows, test records, temporary object keys, request IDs, or client-side prototypes.",
    useCases: [
      "Create identifiers for mock API payloads and seed data.",
      "Generate one-off IDs for local development without calling a backend.",
      "Copy a UUID quickly while debugging database records or event logs.",
    ],
    examples: [
      "Add a UUID to a JSON fixture before importing test records.",
      "Create a unique correlation ID while tracing a frontend request.",
    ],
    faqs: [
      {
        question: "What is a UUID used for?",
        answer:
          "A UUID is commonly used as a unique identifier for records, files, sessions, logs, or temporary objects where collisions should be extremely unlikely.",
      },
      {
        question: "Can I use generated UUIDs in production data?",
        answer:
          "Yes, UUIDs are widely used in production systems, but choose the UUID version and generation location according to your database and application requirements.",
      },
    ],
  },
  "/tools/generators/random-port-generator": {
    summary:
      "Use the random port generator to pick development server ports outside the well-known system range, especially when several local services are running at once.",
    useCases: [
      "Find a port for a local Next.js, Vite, Express, or API service.",
      "Generate several candidate ports for Docker Compose or test scripts.",
      "Avoid common reserved ports below 1024.",
    ],
    examples: [
      "Generate five ports before starting multiple local microservices.",
      "Copy a random port into an `.env.local` file for a temporary dev server.",
    ],
    faqs: [
      {
        question: "What port range does this generator use?",
        answer:
          "It generates ports from 1024 through 65535, avoiding the well-known system ports from 0 through 1023.",
      },
      {
        question: "Does a generated port guarantee the port is free?",
        answer:
          "No. It creates candidate port numbers. Your operating system may still have one of those ports in use, so check or retry if a server fails to bind.",
      },
    ],
  },
  "/tools/code-dev-tools/crontab-generator": {
    summary:
      "Use the crontab generator to build a cron expression and read a plain-language schedule description before adding it to a server, CI job, or automation.",
    useCases: [
      "Draft schedules for recurring scripts and background jobs.",
      "Check what a five-field cron expression means before deploying it.",
      "Copy a cron expression into infrastructure, CI, or scheduler configuration.",
    ],
    examples: [
      "Create `0 9 * * 1` for a job that runs every Monday at 9:00.",
      "Use `*/15 * * * *` for a task that runs every 15 minutes.",
    ],
    faqs: [
      {
        question: "What format does this crontab generator use?",
        answer:
          "It uses the common five-field cron format: minute, hour, day of month, month, and weekday.",
      },
      {
        question: "Should I test a cron expression before production?",
        answer:
          "Yes. Cron implementations can vary by scheduler, timezone, and environment, so test the generated expression in the system where it will run.",
      },
    ],
  },
  "/tools/formatters/json-prettify": {
    summary:
      "Use JSON Prettify to turn compact JSON into readable, indented JSON for debugging API responses, logs, and configuration files.",
    useCases: [
      "Format minified API responses while debugging.",
      "Clean up JSON configuration before reviewing or committing it.",
      "Inspect nested objects and arrays more easily.",
    ],
    examples: [
      "Paste a compressed API response and format it before comparing values.",
      "Prettify a JSON object copied from a browser network panel.",
    ],
    faqs: [
      {
        question: "Does JSON Prettify change the data?",
        answer:
          "It should only change whitespace and indentation when the JSON is valid. The keys and values remain the same.",
      },
      {
        question: "Why does JSON formatting fail?",
        answer:
          "Formatting fails when the input is not valid JSON, such as missing quotes, trailing commas, or unescaped characters.",
      },
    ],
  },
  "/tools/formatters/json-minify": {
    summary:
      "Use JSON Minify to remove unnecessary whitespace from JSON before embedding, storing, or sending it where compact output is easier to handle.",
    useCases: [
      "Compact JSON snippets for documentation or test fixtures.",
      "Reduce whitespace before copying JSON into environment or config fields.",
      "Normalize JSON before comparing payloads.",
    ],
    examples: [
      "Minify a formatted JSON object before pasting it into a single-line config value.",
      "Remove indentation from a sample payload before sharing it in a bug report.",
    ],
    faqs: [
      {
        question: "Does minifying JSON make it faster?",
        answer:
          "It can reduce payload size by removing whitespace, but the performance impact depends on where and how the JSON is used.",
      },
      {
        question: "Can invalid JSON be minified?",
        answer:
          "No. The input must be valid JSON before it can be safely minified.",
      },
    ],
  },
  "/tools/code-dev-tools/regex-tester": {
    summary:
      "Use the regex tester to try a regular expression against sample text before putting it into code, validation rules, or search filters.",
    useCases: [
      "Check whether a pattern matches the text you expect.",
      "Debug validation patterns for forms and scripts.",
      "Experiment with regex syntax before using it in production code.",
    ],
    examples: [
      "Test an email-like pattern against sample form input.",
      "Try a capture group against a log line before adding it to a parser.",
    ],
    faqs: [
      {
        question: "Why does a regex work in one place but not another?",
        answer:
          "Regex behavior can differ by engine, flags, escaping rules, and multiline handling. Test in the same runtime when exact behavior matters.",
      },
      {
        question: "Should regex be used for every parser?",
        answer:
          "No. Regex is useful for patterns, but structured formats such as JSON, XML, or URLs are usually safer with dedicated parsers.",
      },
    ],
  },
  "/tools/converters/base64-encoder-decoder": {
    summary:
      "Use the Base64 encoder and decoder to convert text to Base64 or decode Base64 back into readable text for debugging and data exchange.",
    useCases: [
      "Decode Base64 strings found in API payloads.",
      "Encode small text snippets for tests or examples.",
      "Inspect encoded configuration values while debugging.",
    ],
    examples: [
      "Decode `SGVsbG8=` to confirm the original text.",
      "Encode a short string before adding it to a sample request.",
    ],
    faqs: [
      {
        question: "Is Base64 encryption?",
        answer:
          "No. Base64 is encoding, not encryption. Anyone can decode a Base64 string without a secret key.",
      },
      {
        question: "When should I avoid Base64?",
        answer:
          "Avoid using Base64 as a security mechanism and avoid encoding large files unless the receiving system specifically requires it.",
      },
    ],
  },
  "/tools/media-qr/wifi-qr-code-generator": {
    summary:
      "Use the WiFi QR Code Generator to create a scannable QR code that helps phones and tablets join a WiFi network without typing the password manually.",
    useCases: [
      "Create a QR code for a guest network.",
      "Share WiFi access in a home office, event, or small workspace.",
      "Generate a downloadable QR image for printing.",
    ],
    examples: [
      "Enter the SSID, security type, and password for a guest WiFi network.",
      "Download the generated QR code and add it to a sign or onboarding sheet.",
    ],
    faqs: [
      {
        question: "Is the WiFi password sent to a server?",
        answer:
          "The tool builds the WiFi QR payload in the browser. Be careful with any QR service or downloaded image if the network password is sensitive.",
      },
      {
        question: "What devices can scan a WiFi QR code?",
        answer:
          "Most modern iOS and Android devices can scan WiFi QR codes with the camera app or a QR scanner.",
      },
    ],
  },
  "/tools/hash-encryption/hash-text": {
    summary:
      "Use Hash Text to calculate common hash digests for strings while comparing payloads, checking examples, or debugging integrations.",
    useCases: [
      "Compare a text value against a known hash.",
      "Generate sample hashes for documentation or tests.",
      "Inspect how different hashing algorithms represent the same input.",
    ],
    examples: [
      "Hash a short message with SHA-256 and compare it to an expected digest.",
      "Generate MD5 or SHA examples for a test fixture.",
    ],
    faqs: [
      {
        question: "Can a hash be decrypted?",
        answer:
          "No. Cryptographic hashes are one-way digests. You can compare inputs by hashing them, but you cannot decrypt a hash back to the original text.",
      },
      {
        question: "Should passwords be stored with a simple hash?",
        answer:
          "No. Passwords should use a dedicated password hashing algorithm such as bcrypt, scrypt, or Argon2 with appropriate salts and cost settings.",
      },
    ],
  },
  "/tools/parsers-validators/jwt-parser": {
    summary:
      "Use the JWT parser to inspect a JSON Web Token header and payload while debugging authentication, claims, and token expiration.",
    useCases: [
      "Check token claims while debugging auth flows.",
      "Inspect expiration and issuer fields in a JWT.",
      "Understand token contents without wiring up custom decoding code.",
    ],
    examples: [
      "Decode a development JWT to inspect `exp`, `iss`, and `sub` claims.",
      "Compare token payloads before and after a profile or role change.",
    ],
    faqs: [
      {
        question: "Does parsing a JWT verify it?",
        answer:
          "No. Decoding shows the token contents, but verification requires checking the signature, issuer, audience, and expiration with the correct key.",
      },
      {
        question: "Should I paste production tokens into browser tools?",
        answer:
          "Avoid pasting sensitive production tokens into any tool unless you fully trust the environment and understand the exposure risk.",
      },
    ],
  },
}
