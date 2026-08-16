import {
  Calculator,
  Calendar,
  Code,
  Eye,
  FileCode,
  FileCode2,
  FileJson,
  FileLock,
  FileType,
  Fingerprint,
  Hash,
  Key,
  KeyRound,
  Lock,
  Network,
  Palette,
  RefreshCw,
  Shield,
  ShieldCheck,
  Thermometer,
  Type,
  Zap,
} from "lucide-react";

import type { ToolCategory } from "./tool-types";

/** Generation, encryption, and data-conversion tool definitions. */
export const transformationToolCategories: ToolCategory[] = [
  {
    id: "generators",
    title: "Generators",
    icon: Zap,
    color: "text-yellow-500 dark:text-yellow-400",
    tools: [
      {
        id: "token-generator",
        title: "Token Generator",
        description:
          "Generate random string with the chars you want, uppercase or lowercase letters, numbers and/or symbols.",
        icon: Key,
        path: "/tools/generators/token-generator",
      },
      {
        id: "uuid-generator",
        title: "UUID Generator",
        description:
          "A Universally Unique Identifier (UUID) is a 128-bit number used to identify information in computer systems.",
        icon: Fingerprint,
        path: "/tools/generators/uuid-generator",
      },
      {
        id: "ulid-generator",
        title: "ULID Generator",
        description:
          "Generate random Universally Unique Lexicographically Sortable Identifier (ULID).",
        icon: Fingerprint,
        path: "/tools/generators/ulid-generator",
      },
      {
        id: "bip39-generator",
        title: "BIP39 Passphrase Generator",
        description:
          "Generate a BIP39 passphrase from an existing or random mnemonic, or get the mnemonic from the passphrase.",
        icon: KeyRound,
        path: "/tools/generators/bip39-generator",
      },
      {
        id: "rsa-key-generator",
        title: "RSA Key Pair Generator",
        description:
          "Generate a new random RSA private and public pem certificate key pair.",
        icon: Key,
        path: "/tools/generators/rsa-key-generator",
      },
      {
        id: "otp-generator",
        title: "OTP Code Generator",
        description:
          "Generate and validate time-based OTP (one time password) for multi-factor authentication.",
        icon: ShieldCheck,
        path: "/tools/generators/otp-generator",
      },
      {
        id: "random-port-generator",
        title: "Random Port Generator",
        description:
          "Generate random port numbers outside of the range of 'known' ports (0-1023).",
        icon: Network,
        path: "/tools/generators/random-port-generator",
      },
      {
        id: "mac-generator",
        title: "MAC Address Generator",
        description:
          "Enter the quantity and prefix. MAC addresses will be generated in your chosen case.",
        icon: Network,
        path: "/tools/generators/mac-generator",
      },
      {
        id: "ipv6-ula-generator",
        title: "IPv6 ULA Generator",
        description:
          "Generate your own local, non-routable IP addresses for your network according to RFC4193.",
        icon: Network,
        path: "/tools/generators/ipv6-ula-generator",
      },
    ],
  },
  {
    id: "hash-encryption",
    title: "Hash & Encryption",
    icon: Lock,
    color: "text-red-500 dark:text-red-400",
    tools: [
      {
        id: "hash-text",
        title: "Hash Text",
        description:
          "Hash a text string using the function you need : MD5, SHA1, SHA256, SHA224, SHA512, SHA384, SHA3 or RIPEMD160.",
        icon: Hash,
        path: "/tools/hash-encryption/hash-text",
      },
      {
        id: "bcrypt",
        title: "Bcrypt",
        description:
          "Hash and compare text string using bcrypt. Bcrypt is a password-hashing function based on the Blowfish cipher.",
        icon: Shield,
        path: "/tools/hash-encryption/bcrypt",
      },
      {
        id: "encrypt-decrypt",
        title: "Encrypt / Decrypt Text",
        description:
          "Encrypt clear text and decrypt ciphertext using crypto algorithms like AES, TripleDES, Rabbit or RC4.",
        icon: FileLock,
        path: "/tools/hash-encryption/encrypt-decrypt",
      },
      {
        id: "hmac-generator",
        title: "HMAC Generator",
        description:
          "Computes a hash-based message authentication code (HMAC) using a secret key and your favorite hashing function.",
        icon: Hash,
        path: "/tools/hash-encryption/hmac-generator",
      },
      {
        id: "password-strength",
        title: "Password Strength Analyser",
        description:
          "Discover the strength of your password with this client-side-only password strength analyser and crack time estimation tool.",
        icon: Eye,
        path: "/tools/hash-encryption/password-strength",
      },
    ],
  },
  {
    id: "converters",
    title: "Converters",
    icon: RefreshCw,
    color: "text-purple-500 dark:text-purple-400",
    tools: [
      {
        id: "date-time-converter",
        title: "Date-Time Converter",
        description:
          "Convert date and time into the various different formats.",
        icon: Calendar,
        path: "/tools/converters/date-time-converter",
      },
      {
        id: "integer-base-converter",
        title: "Integer Base Converter",
        description:
          "Convert a number between different bases (decimal, hexadecimal, binary, octal, base64, ...).",
        icon: Calculator,
        path: "/tools/converters/integer-base-converter",
      },
      {
        id: "roman-numeral-converter",
        title: "Roman Numeral Converter",
        description:
          "Convert Roman numerals to numbers and convert numbers to Roman numerals.",
        icon: Type,
        path: "/tools/converters/roman-numeral-converter",
      },
      {
        id: "base64-encoder-decoder",
        title: "Base64 String Encoder/Decoder",
        description:
          "Simply encode and decode strings into their base64 representation.",
        icon: Code,
        path: "/tools/converters/base64-encoder-decoder",
      },
      {
        id: "base64-file-converter",
        title: "Base64 File Converter",
        description:
          "Convert a string, file, or image into its base64 representation.",
        icon: FileCode,
        path: "/tools/converters/base64-file-converter",
      },
      {
        id: "color-converter",
        title: "Color Converter",
        description:
          "Convert color between the different formats (hex, rgb, hsl and css name).",
        icon: Palette,
        path: "/tools/converters/color-converter",
      },
      {
        id: "yaml-to-json",
        title: "YAML to JSON Converter",
        description:
          "Simply convert YAML to JSON with this online live converter.",
        icon: FileJson,
        path: "/tools/converters/yaml-to-json",
      },
      {
        id: "yaml-to-toml",
        title: "YAML to TOML",
        description:
          "Convert structured YAML documents into readable TOML configuration while preserving values and nesting.",
        icon: FileType,
        path: "/tools/converters/yaml-to-toml",
      },
      {
        id: "json-to-yaml",
        title: "JSON to YAML Converter",
        description:
          "Simply convert JSON to YAML with this online live converter.",
        icon: FileJson,
        path: "/tools/converters/json-to-yaml",
      },
      {
        id: "json-to-toml",
        title: "JSON to TOML",
        description:
          "Convert valid JSON objects into readable TOML configuration while preserving values and nesting.",
        icon: FileType,
        path: "/tools/converters/json-to-toml",
      },
      {
        id: "toml-to-json",
        title: "TOML to JSON",
        description:
          "Parse TOML configuration and convert it into formatted JSON for applications, APIs, and debugging.",
        icon: FileJson,
        path: "/tools/converters/toml-to-json",
      },
      {
        id: "toml-to-yaml",
        title: "TOML to YAML",
        description:
          "Parse TOML configuration and convert it into readable YAML while preserving values and nesting.",
        icon: FileType,
        path: "/tools/converters/toml-to-yaml",
      },
      {
        id: "xml-to-json",
        title: "XML to JSON",
        description:
          "Convert XML documents into formatted JSON for easier inspection, transformation, and application use.",
        icon: FileJson,
        path: "/tools/converters/xml-to-json",
      },
      {
        id: "json-to-xml",
        title: "JSON to XML",
        description:
          "Convert valid JSON data into structured XML for integrations, exports, and interoperability workflows.",
        icon: FileCode2,
        path: "/tools/converters/json-to-xml",
      },
      {
        id: "temperature-converter",
        title: "Temperature Converter",
        description:
          "Degrees temperature conversions for Kelvin, Celsius, Fahrenheit, Rankine, Delisle, Newton, Réaumur, and Rømer.",
        icon: Thermometer,
        path: "/tools/converters/temperature-converter",
      },
    ],
  },
];
