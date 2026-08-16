import { createToolReference } from "./create-tool-reference";
import type { ToolReferenceRegistry } from "./types";

export const parserValidatorToolReferences = {
  "/tools/parsers-validators/url-parser": createToolReference(
    "/tools/parsers-validators/url-parser",
    {
      summary:
        "Break a URL into protocol, host, port, path, query parameters, credentials, hash, origin, and other available components.",
      useCases: [
        "Debug redirects and query strings.",
        "Inspect copied integration or callback URLs.",
      ],
      examples: [
        "Extract campaign parameters from a URL.",
        "Check whether a development endpoint includes an unexpected port or fragment.",
      ],
      considerations:
        "Encoded characters, relative URLs, internationalized domains, and embedded credentials need careful interpretation. Do not share URLs containing secrets.",
    },
  ),
  "/tools/parsers-validators/jwt-parser": createToolReference(
    "/tools/parsers-validators/jwt-parser",
    {
      summary:
        "Decode a JSON Web Token header and payload while debugging claims, issuers, audiences, roles, and expiration timestamps.",
      useCases: [
        "Inspect development authentication claims.",
        "Compare token payloads before and after a profile or role change.",
      ],
      examples: [
        "Decode exp, iss, aud, and sub claims.",
        "Check which roles are present in a disposable test token.",
      ],
      considerations:
        "Decoding does not verify the signature or trustworthiness of a token. Avoid pasting production tokens and verify signature, issuer, audience, and time claims in real systems.",
    },
  ),
  "/tools/parsers-validators/user-agent-parser": createToolReference(
    "/tools/parsers-validators/user-agent-parser",
    {
      summary:
        "Parse a user-agent string into reported browser, engine, operating system, CPU, and device details for debugging and analytics review.",
      useCases: [
        "Investigate browser-specific issue reports.",
        "Normalize sample user-agent data in development.",
      ],
      examples: [
        "Identify the reported browser and OS from a support log.",
        "Compare mobile and desktop user-agent samples.",
      ],
      considerations:
        "User-agent strings can be frozen, spoofed, incomplete, or ambiguous. Do not use parsed values as a security boundary or guaranteed device identity.",
    },
  ),
  "/tools/parsers-validators/email-normalizer": createToolReference(
    "/tools/parsers-validators/email-normalizer",
    {
      summary:
        "Normalize email-address formatting for comparison, deduplication, import cleanup, and development data preparation.",
      useCases: [
        "Clean copied addresses before comparing records.",
        "Explore provider-specific normalization rules in a fixture set.",
      ],
      examples: [
        "Trim surrounding whitespace and normalize domain case.",
        "Compare two test addresses after supported normalization.",
      ],
      considerations:
        "Mailbox local-part rules and provider-specific aliases differ. Aggressive normalization can merge distinct real addresses, so preserve the original value.",
    },
  ),
  "/tools/parsers-validators/phone-parser": createToolReference(
    "/tools/parsers-validators/phone-parser",
    {
      summary:
        "Parse, validate, and format phone numbers while identifying available country and number-type information.",
      useCases: [
        "Normalize phone input for a contact workflow.",
        "Check whether a development fixture matches an expected region.",
      ],
      examples: [
        "Format a test number in international notation.",
        "Extract a country calling code from copied input.",
      ],
      considerations:
        "A structurally valid number may not be assigned or reachable. Region defaults, extensions, and changing numbering plans must be handled explicitly.",
    },
  ),
  "/tools/parsers-validators/iban-validator": createToolReference(
    "/tools/parsers-validators/iban-validator",
    {
      summary:
        "Validate IBAN structure and checksum while parsing available country, bank, and account components for testing and data cleanup.",
      useCases: [
        "Check a disposable payment-form fixture.",
        "Normalize spacing before validating imported IBAN data.",
      ],
      examples: [
        "Validate a published example IBAN.",
        "Inspect the country code and checksum digits in test data.",
      ],
      considerations:
        "A valid checksum does not prove an account exists, belongs to a person, or can receive a transfer. Treat IBANs as sensitive financial data.",
    },
  ),
  "/tools/parsers-validators/pdf-signature-checker": createToolReference(
    "/tools/parsers-validators/pdf-signature-checker",
    {
      summary:
        "Inspect embedded PDF signature information to understand whether a document contains signatures and whether reported integrity checks succeed.",
      useCases: [
        "Review a signed-document fixture during integration testing.",
        "Check whether a PDF exposes expected signature metadata.",
      ],
      examples: [
        "Inspect a vendor-provided sample signed PDF.",
        "Compare an original signed fixture with a modified copy.",
      ],
      considerations:
        "Signature presence or cryptographic integrity is not the same as signer identity or legal validity. Certificate trust, revocation, timestamping, and policy require authoritative verification.",
    },
  ),
} satisfies ToolReferenceRegistry;
