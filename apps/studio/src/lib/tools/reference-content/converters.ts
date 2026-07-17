import { createToolReference } from "./create-tool-reference";
import type { ToolReferenceRegistry } from "./types";

export const converterToolReferences = {
  "/tools/converters/date-time-converter": createToolReference(
    "/tools/converters/date-time-converter",
    {
      summary:
        "Convert dates and timestamps between common machine-readable and human-readable formats while debugging APIs, logs, and scheduled workflows.",
      useCases: [
        "Interpret timestamps found in logs and payloads.",
        "Prepare a date value for another API or storage format.",
      ],
      examples: [
        "Convert a Unix timestamp into a readable date.",
        "Compare ISO 8601 output with a local date representation.",
      ],
      considerations:
        "Confirm timezone, locale, daylight-saving behavior, and whether an input represents seconds or milliseconds before relying on the result.",
    },
  ),
  "/tools/converters/integer-base-converter": createToolReference(
    "/tools/converters/integer-base-converter",
    {
      summary:
        "Convert integer values between binary, octal, decimal, hexadecimal, and other supported bases for programming and protocol work.",
      useCases: [
        "Inspect bit-oriented values and flags.",
        "Translate identifiers or constants between source formats.",
      ],
      examples: [
        "Convert decimal 255 to hexadecimal FF.",
        "Translate a binary permission mask into decimal.",
      ],
      considerations:
        "Check supported range, sign handling, prefix conventions, and whether the source value is truly an integer rather than encoded bytes.",
    },
  ),
  "/tools/converters/roman-numeral-converter": createToolReference(
    "/tools/converters/roman-numeral-converter",
    {
      summary:
        "Convert conventional Roman numerals to integers and integers back to Roman notation for labels, educational material, and validation.",
      useCases: [
        "Check numbered headings, editions, or chapters.",
        "Validate Roman-numeral input in a form or exercise.",
      ],
      examples: ["Convert MCMXCIV to 1994.", "Render 42 as XLII."],
      considerations:
        "Roman-numeral conventions and supported numeric ranges vary. Confirm that non-standard subtractive forms are handled as expected.",
    },
  ),
  "/tools/converters/base64-encoder-decoder": createToolReference(
    "/tools/converters/base64-encoder-decoder",
    {
      summary:
        "Encode text as Base64 or decode Base64 into readable text for debugging payloads, examples, and data-exchange formats.",
      useCases: [
        "Inspect encoded strings found in development payloads.",
        "Create small Base64 fixtures for documentation or tests.",
      ],
      examples: [
        "Decode SGVsbG8= to confirm the original text.",
        "Encode a short UTF-8 message for a sample request.",
      ],
      considerations:
        "Base64 is encoding, not encryption. Confirm the character encoding and avoid treating encoded sensitive data as protected.",
    },
  ),
  "/tools/converters/base64-file-converter": createToolReference(
    "/tools/converters/base64-file-converter",
    {
      summary:
        "Convert a file or image to Base64 and reconstruct supported data from Base64 when testing uploads, data URLs, and transport formats.",
      useCases: [
        "Create a data URL for a small development asset.",
        "Inspect or restore a Base64-encoded file fixture.",
      ],
      examples: [
        "Convert a small PNG into a Base64 data string.",
        "Decode a test attachment payload back into a file.",
      ],
      considerations:
        "Base64 increases size and can consume substantial memory for large files. Verify MIME type, prefix, and privacy before processing or sharing output.",
    },
  ),
  "/tools/converters/color-converter": createToolReference(
    "/tools/converters/color-converter",
    {
      summary:
        "Convert colors between hexadecimal, RGB, HSL, and supported CSS-name representations while building or reviewing interface palettes.",
      useCases: [
        "Translate design tokens between CSS formats.",
        "Inspect equivalent color values while debugging styles.",
      ],
      examples: [
        "Convert #ff5a4f into RGB and HSL.",
        "Resolve a CSS color name to its hexadecimal value.",
      ],
      considerations:
        "Equivalent formats can differ because of rounding, alpha handling, gamut, and color-space assumptions. Verify the rendered result in the target environment.",
    },
  ),
  "/tools/converters/yaml-to-json": createToolReference(
    "/tools/converters/yaml-to-json",
    {
      summary:
        "Convert YAML documents into JSON for API payloads, configuration tooling, and structured-data inspection.",
      useCases: [
        "Translate YAML configuration for a JSON-only consumer.",
        "Inspect YAML mappings and arrays as explicit JSON values.",
      ],
      examples: [
        "Convert a CI configuration snippet into JSON.",
        "Translate a YAML list of services into a JSON array.",
      ],
      considerations:
        "YAML supports tags, anchors, comments, and scalar rules that may not round-trip into JSON. Review types and lost metadata after conversion.",
    },
  ),
  "/tools/converters/yaml-to-toml": createToolReference(
    "/tools/converters/yaml-to-toml",
    {
      summary:
        "Convert YAML configuration into TOML when moving settings between ecosystems or comparing configuration formats.",
      useCases: [
        "Prepare YAML settings for a TOML-based application.",
        "Compare nested configuration structure across formats.",
      ],
      examples: [
        "Convert a package configuration prototype to TOML.",
        "Translate a YAML table of service settings into TOML sections.",
      ],
      considerations:
        "The formats represent dates, nulls, arrays, and complex keys differently. Review the output instead of assuming a lossless round trip.",
    },
  ),
  "/tools/converters/json-to-yaml": createToolReference(
    "/tools/converters/json-to-yaml",
    {
      summary:
        "Convert JSON data into readable YAML for configuration files, documentation, and infrastructure workflows.",
      useCases: [
        "Turn an API example into YAML documentation.",
        "Prepare JSON configuration for a YAML-based system.",
      ],
      examples: [
        "Convert a JSON service list into YAML.",
        "Translate a nested JSON fixture into an editable YAML file.",
      ],
      considerations:
        "YAML serializers can choose different quoting and scalar styles. Review strings, dates, nulls, and multiline values before use.",
    },
  ),
  "/tools/converters/json-to-toml": createToolReference(
    "/tools/converters/json-to-toml",
    {
      summary:
        "Convert JSON objects into TOML configuration while moving structured settings into TOML-based tools and projects.",
      useCases: [
        "Prepare JSON settings for a TOML configuration file.",
        "Compare nested objects with TOML tables and arrays.",
      ],
      examples: [
        "Convert a JSON package configuration to TOML.",
        "Translate an array of server objects into TOML table arrays.",
      ],
      considerations:
        "Not every JSON shape has a direct TOML representation. Review null values, heterogeneous arrays, numeric limits, and key naming.",
    },
  ),
  "/tools/converters/toml-to-json": createToolReference(
    "/tools/converters/toml-to-json",
    {
      summary:
        "Convert TOML configuration into JSON for APIs, validation, programmatic inspection, and tooling that expects JSON input.",
      useCases: [
        "Inspect TOML configuration as a JSON object.",
        "Move TOML settings into a JSON-only workflow.",
      ],
      examples: [
        "Convert project metadata into JSON for a script.",
        "Translate TOML table arrays into JSON arrays.",
      ],
      considerations:
        "Review date/time values, integer precision, and comments because JSON cannot preserve every TOML type or annotation exactly.",
    },
  ),
  "/tools/converters/toml-to-yaml": createToolReference(
    "/tools/converters/toml-to-yaml",
    {
      summary:
        "Convert TOML configuration into YAML when migrating settings or sharing them with YAML-oriented tooling.",
      useCases: [
        "Prepare TOML settings for a YAML deployment file.",
        "Compare TOML tables with YAML mappings.",
      ],
      examples: [
        "Convert project metadata into a YAML document.",
        "Translate TOML server tables into a YAML list.",
      ],
      considerations:
        "Comments, date types, numeric precision, and table structure may change representation. Validate the result in the destination parser.",
    },
  ),
  "/tools/converters/xml-to-json": createToolReference(
    "/tools/converters/xml-to-json",
    {
      summary:
        "Convert XML into JSON for easier inspection, JavaScript processing, API adaptation, and test-fixture creation.",
      useCases: [
        "Inspect an XML response as nested JSON.",
        "Prepare legacy XML data for a JSON-based prototype.",
      ],
      examples: [
        "Convert an RSS-like XML sample into JSON.",
        "Translate an XML configuration fixture for a frontend test.",
      ],
      considerations:
        "Attributes, namespaces, mixed content, repeated elements, and ordering do not have one universal JSON mapping. Confirm the chosen structure.",
    },
  ),
  "/tools/converters/json-to-xml": createToolReference(
    "/tools/converters/json-to-xml",
    {
      summary:
        "Convert JSON data into XML for legacy integrations, examples, and systems that require element-based payloads.",
      useCases: [
        "Draft an XML request from a JSON fixture.",
        "Explore how nested JSON maps to XML elements.",
      ],
      examples: [
        "Convert a customer object into an XML sample.",
        "Translate a JSON list into repeated XML elements.",
      ],
      considerations:
        "JSON does not define element names, attributes, namespaces, or a root node. Review the generated schema before using it with a strict consumer.",
    },
  ),
  "/tools/converters/temperature-converter": createToolReference(
    "/tools/converters/temperature-converter",
    {
      summary:
        "Convert temperature values across Celsius, Fahrenheit, Kelvin, Rankine, and other supported historical scales.",
      useCases: [
        "Translate weather or scientific values between unit systems.",
        "Check conversion examples for educational material or forms.",
      ],
      examples: [
        "Convert 100 °C to 212 °F.",
        "Translate absolute zero into Kelvin and Celsius.",
      ],
      considerations:
        "Use the correct source scale and remember that rounded display values can differ slightly from full-precision calculations.",
    },
  ),
} satisfies ToolReferenceRegistry;
