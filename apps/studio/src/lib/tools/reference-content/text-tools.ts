import { createToolReference } from "./create-tool-reference";
import type { ToolReferenceRegistry } from "./types";

export const textToolReferences = {
  "/tools/text-tools/case-converter": createToolReference(
    "/tools/text-tools/case-converter",
    {
      summary:
        "Transform text between common capitalization and identifier styles for code, content, filenames, and structured labels.",
      useCases: [
        "Normalize headings or copied content.",
        "Convert phrases into camelCase, snake_case, kebab-case, or title case.",
      ],
      examples: [
        "Convert hello world to helloWorld.",
        "Turn a heading into a lowercase kebab-case slug candidate.",
      ],
      considerations:
        "A mechanical case conversion may not preserve acronyms, locale-specific letters, punctuation, or editorial capitalization rules.",
    },
  ),
  "/tools/text-tools/text-to-nato": createToolReference(
    "/tools/text-tools/text-to-nato",
    {
      summary:
        "Translate letters and digits into the NATO phonetic alphabet for clearer spoken communication over calls, radio, and support channels.",
      useCases: [
        "Spell identifiers clearly during a voice conversation.",
        "Prepare call scripts that include codes or serial numbers.",
      ],
      examples: [
        "Translate JG into Juliett Golf.",
        "Read an alphanumeric support code using phonetic words.",
      ],
      considerations:
        "Confirm the expected alphabet for the audience because aviation, military, emergency, and regional phonetic conventions can differ.",
    },
  ),
  "/tools/text-tools/text-to-ascii-binary": createToolReference(
    "/tools/text-tools/text-to-ascii-binary",
    {
      summary:
        "Convert text characters to ASCII-oriented binary values and decode compatible binary groups back into text.",
      useCases: [
        "Demonstrate character encoding in educational material.",
        "Inspect simple byte values in debugging exercises.",
      ],
      examples: [
        "Convert A into 01000001.",
        "Decode space-separated eight-bit groups into text.",
      ],
      considerations:
        "ASCII covers a limited character set. Non-ASCII text requires an encoding such as UTF-8 and may use multiple bytes per character.",
    },
  ),
  "/tools/text-tools/text-to-unicode": createToolReference(
    "/tools/text-tools/text-to-unicode",
    {
      summary:
        "Inspect text as Unicode code points or escapes and convert compatible Unicode representations back into readable characters.",
      useCases: [
        "Debug invisible, accented, or non-Latin characters.",
        "Create Unicode escape examples for code and documentation.",
      ],
      examples: [
        "Inspect the code point for an emoji.",
        "Decode a sequence such as \\u0041 into A.",
      ],
      considerations:
        "Code points, UTF-16 code units, grapheme clusters, and rendered characters are different concepts. Normalization can also affect comparisons.",
    },
  ),
  "/tools/text-tools/list-converter": createToolReference(
    "/tools/text-tools/list-converter",
    {
      summary:
        "Transform line- or column-based lists by sorting, reversing, transposing, changing case, truncating values, or adding prefixes and suffixes.",
      useCases: [
        "Prepare copied spreadsheet values for code or configuration.",
        "Normalize repeated text rows before importing them elsewhere.",
      ],
      examples: [
        "Add quotation marks and commas to a column of identifiers.",
        "Sort and lowercase a pasted list of names.",
      ],
      considerations:
        "Review delimiters, blank rows, duplicates, and whitespace before copying the result into a destructive or production workflow.",
    },
  ),
  "/tools/text-tools/slugify-string": createToolReference(
    "/tools/text-tools/slugify-string",
    {
      summary:
        "Convert a phrase into a URL-, filename-, or identifier-friendly slug by normalizing case, separators, and unsupported characters.",
      useCases: [
        "Draft article and product URL segments.",
        "Create predictable filenames or DOM identifiers from labels.",
      ],
      examples: [
        "Convert Hello, World! into hello-world.",
        "Create a slug candidate from a project title.",
      ],
      considerations:
        "Slug rules differ by platform. Check uniqueness, transliteration, reserved names, maximum length, and whether changing a published slug needs a redirect.",
    },
  ),
  "/tools/text-tools/text-statistics": createToolReference(
    "/tools/text-tools/text-statistics",
    {
      summary:
        "Measure characters, words, lines, byte size, and related text statistics while reviewing content, payloads, and input limits.",
      useCases: [
        "Check content against form or platform limits.",
        "Estimate the size and structure of copied text.",
      ],
      examples: [
        "Count words in a draft description.",
        "Compare character count with UTF-8 byte size.",
      ],
      considerations:
        "Word boundaries, line endings, emoji, combined characters, and encoding can make counts differ between editors and systems.",
    },
  ),
  "/tools/text-tools/text-diff": createToolReference(
    "/tools/text-tools/text-diff",
    {
      summary:
        "Compare two text versions and highlight additions, removals, and changed regions for debugging, review, and content verification.",
      useCases: [
        "Inspect changes between configuration versions.",
        "Compare copied output with an expected fixture.",
      ],
      examples: [
        "Compare two API response samples.",
        "Review edits between an original paragraph and a revision.",
      ],
      considerations:
        "Whitespace, line endings, normalization, and ordering can create noisy differences. Normalize only when those changes are not meaningful.",
    },
  ),
  "/tools/text-tools/numeronym-generator": createToolReference(
    "/tools/text-tools/numeronym-generator",
    {
      summary:
        "Create numeronym abbreviations by replacing a word's middle characters with their count, such as internationalization becoming i18n.",
      useCases: [
        "Explore common developer-community abbreviations.",
        "Create compact labels for long repeated terms.",
      ],
      examples: [
        "Convert localization into l10n.",
        "Generate a numeronym for accessibility.",
      ],
      considerations:
        "Numeronyms are not always recognizable or unique. Use the full term when clarity and accessibility matter more than brevity.",
    },
  ),
  "/tools/text-tools/ascii-art-generator": createToolReference(
    "/tools/text-tools/ascii-art-generator",
    {
      summary:
        "Render text as character-based ASCII art using selectable fonts and styles for terminals, comments, and plain-text banners.",
      useCases: [
        "Create a terminal banner for a local script.",
        "Add a decorative heading to plain-text documentation.",
      ],
      examples: [
        "Render a project name in a compact block font.",
        "Generate a monospace heading for a command-line demo.",
      ],
      considerations:
        "ASCII art depends on a monospace font and may wrap or become inaccessible on narrow screens. Keep a plain-text label alongside important content.",
    },
  ),
  "/tools/text-tools/lorem-ipsum-generator": createToolReference(
    "/tools/text-tools/lorem-ipsum-generator",
    {
      summary:
        "Generate placeholder words, sentences, or paragraphs for layout testing before final content is available.",
      useCases: [
        "Test typography and responsive content density.",
        "Populate mock cards, documents, and CMS fixtures.",
      ],
      examples: [
        "Generate three paragraphs for an article layout.",
        "Create a short sentence for a card-description placeholder.",
      ],
      considerations:
        "Placeholder copy can hide real wrapping and comprehension problems. Replace it with representative content before accessibility or product review.",
    },
  ),
  "/tools/text-tools/string-obfuscator": createToolReference(
    "/tools/text-tools/string-obfuscator",
    {
      summary:
        "Mask part of a string so it remains recognizable in screenshots, support messages, and logs without displaying the complete value.",
      useCases: [
        "Redact account identifiers in a bug report.",
        "Show only the beginning or ending of a token-like value.",
      ],
      examples: [
        "Display an IBAN with only the final four characters visible.",
        "Mask the middle of a development API token in documentation.",
      ],
      considerations:
        "Obfuscation is not encryption or anonymization. A partially revealed value may still be sensitive or re-identifiable when combined with other information.",
    },
  ),
} satisfies ToolReferenceRegistry;
