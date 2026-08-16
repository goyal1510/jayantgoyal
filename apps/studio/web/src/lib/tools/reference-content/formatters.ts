import { createToolReference } from "./create-tool-reference";
import type { ToolReferenceRegistry } from "./types";

export const formatterToolReferences = {
  "/tools/formatters/json-prettify": createToolReference(
    "/tools/formatters/json-prettify",
    {
      summary:
        "Turn compact JSON into indented, readable output for debugging API responses, logs, fixtures, and configuration files.",
      useCases: [
        "Format a minified API response.",
        "Clean up JSON before reviewing or committing it.",
      ],
      examples: [
        "Prettify a copied browser network payload.",
        "Indent a nested configuration object for a code review.",
      ],
      considerations:
        "The input must be valid JSON. Formatting changes whitespace, but key ordering and very large numeric values may still need careful review.",
    },
  ),
  "/tools/formatters/json-minify": createToolReference(
    "/tools/formatters/json-minify",
    {
      summary:
        "Remove unnecessary JSON whitespace to produce compact output for fixtures, embedded configuration, and payload examples.",
      useCases: [
        "Create a single-line JSON value for a config field.",
        "Normalize JSON before comparing payloads.",
      ],
      examples: [
        "Minify a formatted sample request.",
        "Remove indentation from a JSON fixture before sharing it.",
      ],
      considerations:
        "Minification does not compress the transport or make invalid JSON valid. Preserve a readable source when humans still need to maintain the data.",
    },
  ),
  "/tools/formatters/sql-prettify": createToolReference(
    "/tools/formatters/sql-prettify",
    {
      summary:
        "Format SQL statements into a more readable layout for debugging, documentation, and query review across supported dialects.",
      useCases: [
        "Reformat a copied query before code review.",
        "Make nested clauses and joins easier to inspect.",
      ],
      examples: [
        "Format a long SELECT statement with several joins.",
        "Indent a migration query copied from a log.",
      ],
      considerations:
        "SQL dialects differ, and formatting does not validate correctness, performance, permissions, or safety. Review the query in its target database.",
    },
  ),
  "/tools/formatters/xml-formatter": createToolReference(
    "/tools/formatters/xml-formatter",
    {
      summary:
        "Indent XML into a readable hierarchy for inspecting documents, SOAP payloads, configuration, and legacy integration responses.",
      useCases: [
        "Format compact XML returned by an API.",
        "Review nested elements and attributes in a fixture.",
      ],
      examples: [
        "Prettify a SOAP response sample.",
        "Indent an XML configuration file before comparing changes.",
      ],
      considerations:
        "Formatting does not validate an XML schema. Whitespace can be meaningful in mixed content, and external entities require secure parser configuration.",
    },
  ),
  "/tools/formatters/yaml-prettify": createToolReference(
    "/tools/formatters/yaml-prettify",
    {
      summary:
        "Reformat YAML into consistent, readable output for configuration review, documentation, and debugging indentation-sensitive files.",
      useCases: [
        "Clean up a copied deployment configuration.",
        "Normalize indentation before reviewing YAML changes.",
      ],
      examples: [
        "Format a CI workflow snippet.",
        "Prettify a nested service configuration.",
      ],
      considerations:
        "YAML indentation, anchors, tags, comments, and scalar styles can affect meaning or round trips. Validate output with the destination parser.",
    },
  ),
} satisfies ToolReferenceRegistry;
