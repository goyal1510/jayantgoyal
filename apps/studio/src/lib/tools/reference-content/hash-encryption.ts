import { createToolReference } from "./create-tool-reference";
import type { ToolReferenceRegistry } from "./types";

export const hashEncryptionToolReferences = {
  "/tools/hash-encryption/hash-text": createToolReference(
    "/tools/hash-encryption/hash-text",
    {
      summary:
        "Calculate common hash digests for text while comparing payloads, checking documented values, or debugging data-integrity integrations.",
      useCases: [
        "Compare a text value with a known digest during development.",
        "Generate sample hashes for fixtures, documentation, and interoperability tests.",
      ],
      examples: [
        "Hash a message with SHA-256 and compare it with an expected value.",
        "Generate several algorithm outputs for the same test string.",
      ],
      considerations:
        "A hash is not encryption and cannot be decrypted. Do not use fast general-purpose hashes such as MD5 or SHA-256 alone for password storage.",
    },
  ),
  "/tools/hash-encryption/bcrypt": createToolReference(
    "/tools/hash-encryption/bcrypt",
    {
      summary:
        "Create bcrypt password hashes and compare candidate text with an existing bcrypt digest while testing authentication and migration workflows.",
      useCases: [
        "Verify development password-hashing behavior across cost settings.",
        "Check whether a test password matches a stored bcrypt fixture.",
      ],
      examples: [
        "Generate a bcrypt hash for an integration-test account.",
        "Compare a candidate value with a copied development digest.",
      ],
      considerations:
        "Choose a cost factor that matches current operational guidance and your latency budget. Never paste real user passwords into an untrusted environment.",
    },
  ),
  "/tools/hash-encryption/encrypt-decrypt": createToolReference(
    "/tools/hash-encryption/encrypt-decrypt",
    {
      summary:
        "Encrypt plaintext or decrypt compatible ciphertext with the selected algorithm and parameters for learning, debugging, and interoperability checks.",
      useCases: [
        "Reproduce a development encryption payload while troubleshooting an integration.",
        "Compare how supported algorithms represent the same sample text.",
      ],
      examples: [
        "Encrypt a disposable message with a test key and decrypt it again.",
        "Check whether an imported ciphertext uses matching algorithm settings.",
      ],
      considerations:
        "Algorithm, key, mode, padding, encoding, IV, and authentication settings must match. Avoid obsolete algorithms and never expose production keys or sensitive plaintext.",
    },
  ),
  "/tools/hash-encryption/hmac-generator": createToolReference(
    "/tools/hash-encryption/hmac-generator",
    {
      summary:
        "Compute a keyed HMAC digest for a message using a selected hash function while testing signed webhooks, request authentication, and data-integrity checks.",
      useCases: [
        "Reproduce a webhook signature with a disposable shared secret.",
        "Verify message-authentication behavior across encodings and hash functions.",
      ],
      examples: [
        "Calculate an HMAC-SHA256 value for a sample request body.",
        "Compare a locally generated digest with an integration fixture.",
      ],
      considerations:
        "The secret, message bytes, encoding, and algorithm must match exactly. Use constant-time comparison in production and do not paste production signing secrets into browser tools.",
    },
  ),
  "/tools/hash-encryption/password-strength": createToolReference(
    "/tools/hash-encryption/password-strength",
    {
      summary:
        "Estimate password strength and approximate crack resistance to understand how length, predictability, and character patterns affect a candidate password.",
      useCases: [
        "Review password-policy examples during account-flow development.",
        "Compare predictable phrases with longer, less guessable alternatives.",
      ],
      examples: [
        "Compare a short complex-looking password with a long passphrase.",
        "Test sample values used in password-strength UI states.",
      ],
      considerations:
        "Strength scores and crack-time estimates are approximations, not guarantees. Never paste a password that protects a real account into an untrusted tool.",
    },
  ),
} satisfies ToolReferenceRegistry;
