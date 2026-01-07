# Chrome Extensions

This directory contains multiple Chrome extensions organized in a monorepo structure.

## Structure

```
extensions/
├── personal/       # Personal extension (counter utility)
├── passwords/      # Passwords extension (example)
└── ...
```

## Creating a New Extension

To create a new extension:

1. Copy an existing extension directory:
   ```bash
   cp -r personal passwords
   ```

2. Update the extension name in:
   - `package.json` - Change the `name` field
   - `manifest.json` - Update the `name` and `description` fields
   - `README.md` - Update the title and description

3. Generate icons for the new extension:
   ```bash
   cd passwords
   pnpm generate-icons
   ```

4. Build and load the extension:
   ```bash
   pnpm build
   # Then load the dist folder in Chrome
   ```

## Development

Each extension can be developed independently:

```bash
# Build personal extension
pnpm --filter personal build

# Build passwords extension
pnpm --filter passwords build

# Build all extensions
pnpm --filter "./extensions/*" build
```

## Loading Extensions in Chrome

1. Build the extension: `pnpm build` (from the extension directory)
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `dist` folder in the extension directory
