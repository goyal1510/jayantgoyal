# Password Manager Extension

A secure password manager Chrome extension.

## Features

- Store and manage passwords securely
- Auto-fill login forms
- Generate strong passwords
- Secure encryption

## Development

```bash
# Install dependencies
pnpm install

# Generate icons
pnpm generate-icons

# Development build (watch mode)
pnpm dev

# Production build
pnpm build

# Type check
pnpm check-types

# Lint
pnpm lint
```

## Loading the Extension

1. Build the extension: `pnpm build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` folder

## Structure

```
password-manager/
├── src/
│   ├── popup/          # Popup UI (React)
│   ├── background/     # Background service worker
│   ├── content/        # Content scripts
│   └── types/          # TypeScript type definitions
├── public/
│   └── icons/          # Extension icons
├── scripts/
│   └── generate-icons.js
├── manifest.json       # Extension manifest
├── vite.config.ts      # Vite build configuration
└── tsconfig.json       # TypeScript configuration
```
