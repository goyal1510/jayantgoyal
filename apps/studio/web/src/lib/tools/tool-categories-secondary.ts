import {
  Calculator,
  Camera,
  Clock,
  Code,
  Code2,
  Database,
  Diff,
  FileCode,
  FileCode2,
  FileJson,
  FileType,
  Gauge,
  GitBranch,
  Globe,
  Globe2,
  Image,
  Info,
  Keyboard,
  Link,
  Network,
  QrCode,
  Regex,
  Server,
  Settings,
  ShieldCheck,
  Smile,
  Timer,
  User,
  Wifi,
} from "lucide-react";

import type { ToolCategory } from "./tool-types";

/** Categories focused on formatting, development, networks, media, and utility work. */
export const secondaryToolCategories: ToolCategory[] = [
  {
    id: "formatters",
    title: "Formatters",
    icon: FileCode,
    color: "text-orange-500 dark:text-orange-400",
    tools: [
      {
        id: "json-prettify",
        title: "JSON Prettify and Format",
        description:
          "Prettify your JSON string into a friendly, human-readable format.",
        icon: FileJson,
        path: "/tools/formatters/json-prettify",
      },
      {
        id: "json-minify",
        title: "JSON Minify",
        description:
          "Minify and compress your JSON by removing unnecessary whitespace.",
        icon: FileJson,
        path: "/tools/formatters/json-minify",
      },
      {
        id: "sql-prettify",
        title: "SQL Prettify and Format",
        description:
          "Format and prettify your SQL queries online (it supports various SQL dialects).",
        icon: Database,
        path: "/tools/formatters/sql-prettify",
      },
      {
        id: "xml-formatter",
        title: "XML Formatter",
        description:
          "Prettify your XML string into a friendly, human-readable format.",
        icon: FileCode2,
        path: "/tools/formatters/xml-formatter",
      },
      {
        id: "yaml-prettify",
        title: "YAML Prettify and Format",
        description:
          "Prettify your YAML string into a friendly, human-readable format.",
        icon: FileType,
        path: "/tools/formatters/yaml-prettify",
      },
    ],
  },
  {
    id: "code-dev-tools",
    title: "Code & Dev Tools",
    icon: Code2,
    color: "text-green-500 dark:text-green-400",
    tools: [
      {
        id: "git-cheatsheet",
        title: "Git Cheatsheet",
        description:
          "Git is a decentralized version management software. With this cheatsheet, you will have quick access to the most common git commands.",
        icon: GitBranch,
        path: "/tools/code-dev-tools/git-cheatsheet",
      },
      {
        id: "regex-tester",
        title: "Regex Tester",
        description:
          "Test regular expressions against sample text and inspect matches while refining patterns and flags.",
        icon: Regex,
        path: "/tools/code-dev-tools/regex-tester",
      },
      {
        id: "regex-cheatsheet",
        title: "Regex Cheatsheet",
        description:
          "Reference common JavaScript regular-expression syntax, groups, assertions, flags, and practical patterns.",
        icon: Regex,
        path: "/tools/code-dev-tools/regex-cheatsheet",
      },
      {
        id: "chmod-calculator",
        title: "Chmod Calculator",
        description:
          "Compute your chmod permissions and commands with this online chmod calculator.",
        icon: Calculator,
        path: "/tools/code-dev-tools/chmod-calculator",
      },
      {
        id: "docker-converter",
        title: "Docker Run to Docker Compose Converter",
        description:
          "Transforms 'docker run' commands into docker-compose files!",
        icon: Server,
        path: "/tools/code-dev-tools/docker-converter",
      },
      {
        id: "http-status-codes",
        title: "HTTP Status Codes",
        description:
          "The list of all HTTP status codes, their name, and their meaning.",
        icon: Globe,
        path: "/tools/code-dev-tools/http-status-codes",
      },
      {
        id: "json-diff",
        title: "JSON Diff",
        description:
          "Compare two JSON objects and get the differences between them.",
        icon: Diff,
        path: "/tools/code-dev-tools/json-diff",
      },
      {
        id: "crontab-generator",
        title: "Crontab Generator",
        description:
          "Validate and generate crontab and get the human-readable description of the cron schedule.",
        icon: Clock,
        path: "/tools/code-dev-tools/crontab-generator",
      },
      {
        id: "keycode-info",
        title: "Keycode Info",
        description:
          "Find the javascript keycode, code, location and modifiers of any pressed key.",
        icon: Keyboard,
        path: "/tools/code-dev-tools/keycode-info",
      },
    ],
  },
  {
    id: "network-tools",
    title: "Network Tools",
    icon: Network,
    color: "text-indigo-500 dark:text-indigo-400",
    tools: [
      {
        id: "ipv4-subnet-calculator",
        title: "IPv4 Subnet Calculator",
        description:
          "Parse your IPv4 CIDR blocks and get all the info you need about your subnet.",
        icon: Network,
        path: "/tools/network-tools/ipv4-subnet-calculator",
      },
      {
        id: "ipv4-address-converter",
        title: "IPv4 Address Converter",
        description:
          "Convert an IP address into decimal, binary, hexadecimal, or even an IPv6 representation of it.",
        icon: Network,
        path: "/tools/network-tools/ipv4-address-converter",
      },
      {
        id: "ipv4-range-expander",
        title: "IPv4 Range Expander",
        description:
          "Given a start and an end IPv4 address, this tool calculates a valid IPv4 subnet along with its CIDR notation.",
        icon: Network,
        path: "/tools/network-tools/ipv4-range-expander",
      },
      {
        id: "mac-address-lookup",
        title: "MAC Address Lookup",
        description:
          "Find the vendor and manufacturer of a device by its MAC address.",
        icon: Network,
        path: "/tools/network-tools/mac-address-lookup",
      },
    ],
  },
  {
    id: "media-qr",
    title: "Media & QR",
    icon: QrCode,
    color: "text-cyan-500 dark:text-cyan-400",
    tools: [
      {
        id: "qr-code-generator",
        title: "QR Code Generator",
        description:
          "Generate and download a QR code for a URL (or just plain text), and customize the background and foreground colors.",
        icon: QrCode,
        path: "/tools/media-qr/qr-code-generator",
      },
      {
        id: "wifi-qr-code-generator",
        title: "WiFi QR Code Generator",
        description:
          "Generate and download QR codes for quick connections to WiFi networks.",
        icon: Wifi,
        path: "/tools/media-qr/wifi-qr-code-generator",
      },
      {
        id: "svg-placeholder-generator",
        title: "SVG Placeholder Generator",
        description:
          "Generate svg images to use as a placeholder in your applications.",
        icon: Image,
        path: "/tools/media-qr/svg-placeholder-generator",
      },
      {
        id: "camera-recorder",
        title: "Camera Recorder",
        description:
          "Take a picture or record a video from your webcam or camera.",
        icon: Camera,
        path: "/tools/media-qr/camera-recorder",
      },
    ],
  },
  {
    id: "calculators",
    title: "Calculators",
    icon: Calculator,
    color: "text-blue-500 dark:text-blue-400",
    tools: [
      {
        id: "math-evaluator",
        title: "Math Evaluator",
        description:
          "A calculator for evaluating mathematical expressions. You can use functions like sqrt, cos, sin, abs, etc.",
        icon: Calculator,
        path: "/tools/calculators/math-evaluator",
      },
      {
        id: "eta-calculator",
        title: "ETA Calculator",
        description:
          "An ETA (Estimated Time of Arrival) calculator to determine the approximate end time of a task, for example, the end time and duration of a file download.",
        icon: Clock,
        path: "/tools/calculators/eta-calculator",
      },
      {
        id: "percentage-calculator",
        title: "Percentage Calculator",
        description:
          "Easily calculate percentages from a value to another value, or from a percentage to a value.",
        icon: Calculator,
        path: "/tools/calculators/percentage-calculator",
      },
      {
        id: "chronometer",
        title: "Chronometer",
        description:
          "Monitor the duration of a thing. Basically a chronometer with simple chronometer features.",
        icon: Timer,
        path: "/tools/calculators/chronometer",
      },
    ],
  },
  {
    id: "other",
    title: "Other",
    icon: Settings,
    color: "text-gray-500 dark:text-gray-400",
    tools: [
      {
        id: "device-information",
        title: "Device Information",
        description:
          "Get information about your current device (screen size, pixel-ratio, user agent, ...).",
        icon: Info,
        path: "/tools/other/device-information",
      },
      {
        id: "basic-auth-generator",
        title: "Basic Auth Generator",
        description:
          "Generate a base64 basic auth header from a username and password.",
        icon: ShieldCheck,
        path: "/tools/other/basic-auth-generator",
      },
      {
        id: "open-graph-generator",
        title: "Open Graph Meta Generator",
        description:
          "Generate open-graph and socials HTML meta tags for your website.",
        icon: Globe2,
        path: "/tools/other/open-graph-generator",
      },
      {
        id: "mime-types",
        title: "MIME Types",
        description: "Convert MIME types to file extensions and vice-versa.",
        icon: FileType,
        path: "/tools/other/mime-types",
      },
      {
        id: "html-wysiwyg-editor",
        title: "HTML WYSIWYG Editor",
        description:
          "Online, feature-rich WYSIWYG HTML editor which generates the source code of the content immediately.",
        icon: FileCode,
        path: "/tools/other/html-wysiwyg-editor",
      },
      {
        id: "outlook-safelink-decoder",
        title: "Outlook Safelink Decoder",
        description:
          "Decode Microsoft Outlook Safe Links and recover the original destination URL for inspection.",
        icon: Link,
        path: "/tools/other/outlook-safelink-decoder",
      },
      {
        id: "json-to-csv",
        title: "JSON to CSV",
        description: "Convert JSON to CSV with automatic header detection.",
        icon: FileJson,
        path: "/tools/other/json-to-csv",
      },
      {
        id: "markdown-to-html",
        title: "Markdown to HTML",
        description: "Convert Markdown to Html and allow to print (as PDF).",
        icon: FileCode2,
        path: "/tools/other/markdown-to-html",
      },
      {
        id: "url-encoder-decoder",
        title: "Encode/Decode URL-formatted Strings",
        description:
          "Encode text to URL-encoded format (also known as 'percent-encoded'), or decode from it.",
        icon: Link,
        path: "/tools/other/url-encoder-decoder",
      },
      {
        id: "html-entities",
        title: "Escape HTML Entities",
        description:
          "Escape or unescape HTML entities (replace characters like <,>, &, \" and ' with their HTML version).",
        icon: Code,
        path: "/tools/other/html-entities",
      },
      {
        id: "benchmark-builder",
        title: "Benchmark Builder",
        description:
          "Easily compare execution time of tasks with this very simple online benchmark builder.",
        icon: Gauge,
        path: "/tools/other/benchmark-builder",
      },
      {
        id: "emoji-picker",
        title: "Emoji Picker",
        description:
          "Copy and paste emojis easily and get the unicode and code points value of each emoji.",
        icon: Smile,
        path: "/tools/other/emoji-picker",
      },
      {
        id: "personal-information-form",
        title: "Personal Information Form",
        description:
          "Fill out personal information including name, phone number, date of birth, age, and gender.",
        icon: User,
        path: "/tools/other/personal-information-form",
      },
    ],
  },
];
