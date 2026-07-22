# Dev Tools

99+ developer utilities for everyday tasks.

**Live**: [studio.jayantgoyal.com/tools](https://studio.jayantgoyal.com/tools)

## Categories

### Generators

- UUID v4, v7
- ULID
- Nanoid
- Random strings/tokens
- RSA key pairs
- Password generator

### Hash & Encryption

- MD5, SHA-1, SHA-256, SHA-512
- Bcrypt hash/verify
- HMAC generation
- AES encrypt/decrypt

### Encoders/Decoders

- Base64 encode/decode
- URL encode/decode
- HTML entities
- Unicode escape

### Converters

- JSON ↔ YAML
- JSON ↔ TOML
- JSON ↔ XML
- Color formats (HEX, RGB, HSL)
- Timestamp ↔ Date
- Number base conversion

### Text Tools

- Case converters (camel, snake, kebab)
- Lorem ipsum generator
- Word/character counter
- Diff checker
- Regex tester

### Validators

- JSON validator
- Email validator
- URL validator
- Regex validator

### Formatters

- JSON formatter/minifier
- SQL formatter
- XML formatter
- Code beautifier

### Parsers

- JWT decoder
- URL parser
- User agent parser
- Cron expression parser

### Media & QR

- QR code generator
- Image to Base64
- Favicon generator

## Tech Stack

- **Web Crypto API** - Cryptographic operations
- **Native APIs** - Encoding, parsing
- **React 19** - UI rendering

## Files

```
src/
├── app/(protected)/tools/
│   ├── page.tsx              # Tools hub
│   ├── [category]/           # Category pages
│   └── [category]/[tool]/    # Individual tools
└── lib/tools/
    └── tools.ts              # Tool configurations
```

## Key Patterns

- **Dynamic routing**: `[category]/[tool]` for clean URLs
- **Client-side by default**: Most utilities process data in the browser
