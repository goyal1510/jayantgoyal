import { createToolReference } from "./create-tool-reference";
import type { ToolReferenceRegistry } from "./types";

export const generatorToolReferences = {
  "/tools/generators/token-generator": createToolReference(
    "/tools/generators/token-generator",
    {
      summary:
        "Generate random strings from a configurable mix of uppercase letters, lowercase letters, numbers, and symbols for development and testing workflows.",
      useCases: [
        "Create temporary identifiers, fixture values, or non-sensitive sample tokens.",
        "Generate strings that satisfy a specific length and character policy.",
      ],
      examples: [
        "Create ten 32-character strings for local API fixtures.",
        "Generate a letters-and-numbers-only value for a test form.",
      ],
      considerations:
        "Treat generated values as convenience output unless the implementation and randomness source meet the security requirements of your real authentication or secret-management system.",
    },
  ),
  "/tools/generators/uuid-generator": createToolReference(
    "/tools/generators/uuid-generator",
    {
      summary:
        "Generate UUID values for database rows, test records, object keys, request identifiers, and other workflows that need collision-resistant identifiers.",
      useCases: [
        "Create identifiers for mock API payloads and seed data.",
        "Copy a UUID while debugging records, events, or distributed requests.",
      ],
      examples: [
        "Add a UUID to a JSON fixture before importing test records.",
        "Create a correlation identifier for a development request trace.",
      ],
      considerations:
        "Choose the UUID version and generation location according to your database ordering, privacy, and application requirements.",
    },
  ),
  "/tools/generators/ulid-generator": createToolReference(
    "/tools/generators/ulid-generator",
    {
      summary:
        "Generate lexicographically sortable ULIDs that combine a timestamp component with randomness in a compact, case-insensitive representation.",
      useCases: [
        "Create sortable identifiers for logs, events, and append-heavy records.",
        "Use readable identifiers where UUID-style uniqueness and chronological ordering are useful together.",
      ],
      examples: [
        "Generate ULIDs for queued jobs that should sort approximately by creation time.",
        "Create fixture IDs for an event timeline or audit log.",
      ],
      considerations:
        "ULIDs expose an encoded creation timestamp, so avoid them where revealing approximate creation time would be undesirable.",
    },
  ),
  "/tools/generators/bip39-generator": createToolReference(
    "/tools/generators/bip39-generator",
    {
      summary:
        "Generate or inspect BIP39 mnemonic phrases and derive the related seed material for wallet-development, interoperability, and recovery-flow testing.",
      useCases: [
        "Test wallet onboarding and recovery interfaces with disposable mnemonic data.",
        "Check how a mnemonic and optional passphrase affect derived seed output.",
      ],
      examples: [
        "Generate a throwaway mnemonic for a local wallet prototype.",
        "Compare seed output with and without an additional BIP39 passphrase.",
      ],
      considerations:
        "Never paste or generate a mnemonic that controls real funds in an untrusted environment. Verify the implementation and use an offline, audited workflow for production wallets.",
    },
  ),
  "/tools/generators/rsa-key-generator": createToolReference(
    "/tools/generators/rsa-key-generator",
    {
      summary:
        "Generate an RSA public and private key pair in PEM form for development, interoperability checks, and cryptographic integration prototypes.",
      useCases: [
        "Create disposable keys for local signing or encryption experiments.",
        "Test whether an application accepts expected PEM public and private key formats.",
      ],
      examples: [
        "Generate a temporary key pair for a local JWT signing experiment.",
        "Copy a public key into a development verification service.",
      ],
      considerations:
        "Production private keys require an audited generator, appropriate key size, secure storage, rotation, and access controls. Do not reuse browser-generated test keys as production secrets.",
    },
  ),
  "/tools/generators/otp-generator": createToolReference(
    "/tools/generators/otp-generator",
    {
      summary:
        "Generate and validate time-based one-time password codes while testing multi-factor authentication setup and verification flows.",
      useCases: [
        "Check a TOTP secret and current verification code during local development.",
        "Prototype authenticator enrollment and code-validation interfaces.",
      ],
      examples: [
        "Generate a current code from a disposable development secret.",
        "Validate that a copied code matches the configured time window.",
      ],
      considerations:
        "Do not paste production MFA secrets into an untrusted tool. Clock drift, algorithm, digit count, and time-step settings must match the authenticating service.",
    },
  ),
  "/tools/generators/random-port-generator": createToolReference(
    "/tools/generators/random-port-generator",
    {
      summary:
        "Generate candidate development server ports outside the well-known system range when several local services need separate bindings.",
      useCases: [
        "Find candidate ports for local Next.js, Vite, Express, or API services.",
        "Generate several values for Docker Compose, integration tests, or temporary scripts.",
      ],
      examples: [
        "Generate five ports before starting multiple local microservices.",
        "Copy a candidate port into a temporary development environment file.",
      ],
      considerations:
        "A generated value is not guaranteed to be free. Check whether the operating system already has the port in use before binding a service.",
    },
  ),
  "/tools/generators/mac-generator": createToolReference(
    "/tools/generators/mac-generator",
    {
      summary:
        "Generate formatted MAC addresses with a chosen prefix, quantity, and letter case for network fixtures, documentation, and test data.",
      useCases: [
        "Create sample device identifiers for network-management prototypes.",
        "Generate addresses with a controlled vendor prefix for parsing tests.",
      ],
      examples: [
        "Generate twenty uppercase MAC addresses for a device inventory fixture.",
        "Create test addresses that share the same organizational prefix.",
      ],
      considerations:
        "Generated addresses may collide with real or locally administered devices. Use them as test data and follow the correct unicast/local bit rules for simulated networks.",
    },
  ),
  "/tools/generators/ipv6-ula-generator": createToolReference(
    "/tools/generators/ipv6-ula-generator",
    {
      summary:
        "Generate IPv6 Unique Local Address prefixes for private, non-publicly-routable network planning based on the RFC 4193 address space.",
      useCases: [
        "Plan private IPv6 addressing for labs, development networks, or internal services.",
        "Create example ULA prefixes for infrastructure documentation and test configuration.",
      ],
      examples: [
        "Generate a prefix for an isolated home-lab network.",
        "Use a ULA subnet in a sample router or container-network configuration.",
      ],
      considerations:
        "Confirm subnet boundaries, routing, DNS, and collision assumptions before deploying a generated prefix across connected private networks.",
    },
  ),
} satisfies ToolReferenceRegistry;
