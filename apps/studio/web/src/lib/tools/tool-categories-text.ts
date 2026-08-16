import {
  BarChart3,
  Code,
  CreditCard,
  Diff,
  EyeOff,
  FileCheck,
  FileCode,
  FileText,
  Hash,
  Key,
  Link,
  List,
  Mail,
  Phone,
  Search,
  Text,
  Type,
  User,
} from "lucide-react";

import type { ToolCategory } from "./tool-types";

/** Text transformation and structured-input inspection definitions. */
export const textAndParserToolCategories: ToolCategory[] = [
  {
    id: "text-tools",
    title: "Text Tools",
    icon: Type,
    color: "text-amber-500 dark:text-amber-400",
    tools: [
      {
        id: "case-converter",
        title: "Case Converter",
        description:
          "Transform the case of a string and choose between different formats.",
        icon: Type,
        path: "/tools/text-tools/case-converter",
      },
      {
        id: "text-to-nato",
        title: "Text to NATO Alphabet",
        description:
          "Transform text into the NATO phonetic alphabet for oral transmission.",
        icon: Text,
        path: "/tools/text-tools/text-to-nato",
      },
      {
        id: "text-to-ascii-binary",
        title: "Text to ASCII Binary",
        description:
          "Convert text to its ASCII binary representation and vice-versa.",
        icon: Code,
        path: "/tools/text-tools/text-to-ascii-binary",
      },
      {
        id: "text-to-unicode",
        title: "Text to Unicode",
        description:
          "Convert text into Unicode code points and decode Unicode sequences back into readable text.",
        icon: Type,
        path: "/tools/text-tools/text-to-unicode",
      },
      {
        id: "list-converter",
        title: "List Converter",
        description:
          "Transform column-based lists by transposing, sorting, reversing, changing case, truncating values, or adding a prefix and suffix.",
        icon: List,
        path: "/tools/text-tools/list-converter",
      },
      {
        id: "slugify-string",
        title: "Slugify String",
        description:
          "Turn text into a clean, lowercase slug suitable for URLs, filenames, anchors, and identifiers.",
        icon: Link,
        path: "/tools/text-tools/slugify-string",
      },
      {
        id: "text-statistics",
        title: "Text Statistics",
        description:
          "Get information about a text, the number of characters, the number of words, its size in bytes, ...",
        icon: BarChart3,
        path: "/tools/text-tools/text-statistics",
      },
      {
        id: "text-diff",
        title: "Text Diff",
        description: "Compare two texts and see the differences between them.",
        icon: Diff,
        path: "/tools/text-tools/text-diff",
      },
      {
        id: "numeronym-generator",
        title: "Numeronym Generator",
        description:
          'A numeronym is a word where a number is used to form an abbreviation. For example, "i18n" is a numeronym of "internationalization".',
        icon: Hash,
        path: "/tools/text-tools/numeronym-generator",
      },
      {
        id: "ascii-art-generator",
        title: "ASCII Art Text Generator",
        description:
          "Generate copyable ASCII art text with a selection of readable fonts and visual styles.",
        icon: FileCode,
        path: "/tools/text-tools/ascii-art-generator",
      },
      {
        id: "lorem-ipsum-generator",
        title: "Lorem Ipsum Generator",
        description:
          "Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content.",
        icon: FileText,
        path: "/tools/text-tools/lorem-ipsum-generator",
      },
      {
        id: "string-obfuscator",
        title: "String Obfuscator",
        description:
          "Obfuscate a string (like a secret, an IBAN, or a token) to make it shareable and identifiable without revealing its content.",
        icon: EyeOff,
        path: "/tools/text-tools/string-obfuscator",
      },
    ],
  },
  {
    id: "parsers-validators",
    title: "Parsers",
    icon: Search,
    color: "text-emerald-500 dark:text-emerald-400",
    tools: [
      {
        id: "url-parser",
        title: "URL Parser",
        description:
          "Parse a URL into its separate constituent parts (protocol, origin, params, port, username-password, ...).",
        icon: Link,
        path: "/tools/parsers-validators/url-parser",
      },
      {
        id: "jwt-parser",
        title: "JWT Parser",
        description:
          "Parse and decode your JSON Web Token (jwt) and display its content.",
        icon: Key,
        path: "/tools/parsers-validators/jwt-parser",
      },
      {
        id: "user-agent-parser",
        title: "User-Agent Parser",
        description:
          "Detect and parse Browser, Engine, OS, CPU, and Device type/model from an user-agent string.",
        icon: User,
        path: "/tools/parsers-validators/user-agent-parser",
      },
      {
        id: "email-normalizer",
        title: "Email Normalizer",
        description:
          "Normalize email addresses to a standard format for easier comparison. Useful for deduplication and data cleaning.",
        icon: Mail,
        path: "/tools/parsers-validators/email-normalizer",
      },
      {
        id: "phone-parser",
        title: "Phone Parser and Formatter",
        description:
          "Parse, validate and format phone numbers. Get information about the phone number, like the country code, type, etc.",
        icon: Phone,
        path: "/tools/parsers-validators/phone-parser",
      },
      {
        id: "iban-validator",
        title: "IBAN Validator and Parser",
        description:
          "Validate and parse IBAN numbers. Check if an IBAN is valid and get information about it.",
        icon: CreditCard,
        path: "/tools/parsers-validators/iban-validator",
      },
      {
        id: "pdf-signature-checker",
        title: "PDF Signature Checker",
        description:
          "Inspect a PDF's embedded signatures to determine whether its contents may have changed after the document was signed.",
        icon: FileCheck,
        path: "/tools/parsers-validators/pdf-signature-checker",
      },
    ],
  },
];
