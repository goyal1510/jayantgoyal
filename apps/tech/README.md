# Tech Tools

A comprehensive collection of 99+ developer tools and utilities built with Next.js, React, and TypeScript. This application provides a wide range of tools for developers including generators, converters, parsers, validators, formatters, and more.

## Features

- **99+ Developer Tools** organized into 10 categories:
  - **Generators**: Token, UUID, ULID, BIP39, RSA Keys, OTP, Ports, MAC Addresses, IPv6 ULA
  - **Hash & Encryption**: Hash Text, Bcrypt, Encrypt/Decrypt, HMAC Generator, Password Strength Analyzer
  - **Converters**: Date-Time, Base64, Integer Base, Color, Roman Numerals, Temperature, JSON/YAML/TOML/XML conversions
  - **Text Tools**: Case Converter, NATO Alphabet, ASCII Binary, Unicode, Slugify, Statistics, Diff, Lorem Ipsum, Numeronym, String Obfuscator, ASCII Art, List Converter
  - **Parsers & Validators**: URL Parser, JWT Parser, User-Agent Parser, Email Normalizer, Phone Parser, IBAN Validator, PDF Signature Checker
  - **Formatters**: JSON Prettify/Minify, SQL Prettify, XML Formatter, YAML Prettify
  - **Code & Dev Tools**: Git Cheatsheet, Regex Tester/Cheatsheet, Chmod Calculator, HTTP Status Codes, JSON Diff, Crontab Generator, Keycode Info, Docker Converter
  - **Network Tools**: IPv4 Subnet Calculator, IPv4 Address Converter, IPv4 Range Expander, MAC Address Lookup
  - **Media & QR**: QR Code Generator, WiFi QR Generator, SVG Placeholder Generator, Camera Recorder
  - **Calculators**: Math Evaluator, ETA Calculator, Percentage Calculator, Chronometer
  - **Other**: Device Information, Basic Auth Generator, Open Graph Generator, MIME Types, HTML WYSIWYG Editor, Outlook SafeLink Decoder, JSON to CSV, Markdown to HTML, URL Encoder/Decoder, HTML Entities, Benchmark Builder, Emoji Picker

- **Modern UI**: Built with Radix UI components, Tailwind CSS, and Lucide icons
- **Dark Mode**: Full dark mode support with theme toggle
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Collapsible Sidebar**: Organized navigation with collapsible categories
- **Active State Highlighting**: Sidebar automatically highlights the current page
- **Copy to Clipboard**: Most tools include one-click copy functionality
- **Real-time Updates**: Tools update results in real-time as you type

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Type Safety**: TypeScript
- **Notifications**: Sonner
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm (recommended) or npm/yarn

### Installation

From the repository root:

```bash
# Install all dependencies
pnpm install

# Run the tech app in development mode
pnpm dev --filter tech
```

The application will be available at `http://localhost:3000` (or the next available port).

### Building for Production

```bash
# Build the application
pnpm build --filter tech

# Start the production server
pnpm start --filter tech
```

## Project Structure

```
apps/tech/
├── src/
│   ├── app/
│   │   ├── (protected)/          # Protected routes (all tool pages)
│   │   │   ├── page.tsx         # Landing page with all tools
│   │   │   ├── layout.tsx       # Layout with sidebar
│   │   │   └── [tool-name]/     # Individual tool pages
│   │   └── layout.tsx           # Root layout
│   ├── components/
│   │   ├── app-sidebar.tsx      # Main sidebar navigation
│   │   ├── nav-main.tsx         # Navigation component
│   │   └── ui/                  # Shared UI components
│   └── lib/
│       └── tools.ts             # Tool definitions and metadata
├── package.json
└── README.md
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm check-types` - Type check with TypeScript

## Tool Categories

### Generators
Create random tokens, UUIDs, ULIDs, cryptographic keys, OTP codes, and more.

### Hash & Encryption
Hash text with various algorithms (MD5, SHA-256, SHA-512, etc.), encrypt/decrypt text, generate HMACs, and analyze password strength.

### Converters
Convert between different formats: dates, bases, colors, Roman numerals, temperatures, and various data formats (JSON, YAML, TOML, XML).

### Text Tools
Transform text with case converters, NATO alphabet, ASCII/Unicode conversions, slugify strings, analyze text statistics, and more.

### Parsers & Validators
Parse URLs, JWTs, user agents, emails, phone numbers, IBANs, and validate PDF signatures.

### Formatters
Prettify and format JSON, SQL, XML, and YAML code.

### Code & Dev Tools
Access Git commands, test regex patterns, calculate chmod permissions, view HTTP status codes, compare JSON, generate crontab expressions, and more.

### Network Tools
Calculate IPv4 subnets, convert IP addresses, expand IP ranges, and lookup MAC addresses.

### Media & QR
Generate QR codes, WiFi QR codes, SVG placeholders, and record from camera.

### Calculators
Evaluate math expressions, calculate ETAs, percentages, and use a chronometer.

## Contributing

This project is part of a monorepo. When adding new tools:

1. Add the tool definition to `src/lib/tools.ts`
2. Create a new page file in `src/app/(protected)/[tool-name]/page.tsx`
3. Implement the tool functionality
4. Ensure TypeScript types are correct
5. Test the tool thoroughly

## License

Private project - All rights reserved.
