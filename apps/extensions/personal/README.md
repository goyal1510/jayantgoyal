# Personal Extension - Job Application Autofill

A Chrome extension for automatically filling job application forms with your personal information.

## Features

- **Store Personal Information**: Save all your job application details in one place
  - Basic info (first name, last name, email, phone)
  - Address (line 1, line 2, city, state, pin code)
  - Professional info (experience, current company, previous companies)
  - Links (resume, GitHub, portfolio, LinkedIn)

- **Smart Autofill**: Automatically detects and fills form fields on job application websites
  - Matches fields by name, id, placeholder, and label text
  - Supports common field patterns and variations
  - Visual notification when fields are filled

- **Easy to Use**: 
  - Fill out your information once in the popup
  - Click "Autofill Form" button to fill any job application page
  - Or use keyboard shortcut `Ctrl+Shift+A` (Windows/Linux) or `Cmd+Shift+A` (Mac)

## How to Use

1. **First Time Setup**:
   - Click the extension icon to open the popup
   - Fill in all your personal information (pre-filled with data from your portfolio)
   - Click "Save Information" to store your data

2. **Autofill Forms**:
   - Navigate to any job application page
   - Click the extension icon and click "Autofill Form"
   - Or use the keyboard shortcut `Ctrl+Shift+A` / `Cmd+Shift+A`
   - The extension will automatically detect and fill matching fields

3. **Update Information**:
   - Open the popup anytime to update your information
   - Click "Save Information" to save changes

## Development

```bash
# Generate placeholder icons (first time setup)
pnpm generate-icons

# Build in watch mode
pnpm dev

# Build for production
pnpm build
```

## Loading the Extension

1. Generate icons (if not already done): `pnpm generate-icons`
2. Build the extension: `pnpm build`
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" (toggle in top right)
5. Click "Load unpacked"
6. Select the `dist` folder in this directory

## Structure

- `src/popup/` - Popup UI (React app)
- `src/background/` - Background service worker
- `src/content/` - Content script that runs on web pages
- `manifest.json` - Extension manifest (Manifest V3)
- `public/icons/` - Extension icons
- `scripts/generate-icons.js` - Script to generate placeholder icons

## Icons

The extension includes a script to generate placeholder icons. Run `pnpm generate-icons` to create them. You can replace the generated icons in `public/icons/` with your own custom icons (16x16, 32x32, 48x48, 128x128 PNG files).
