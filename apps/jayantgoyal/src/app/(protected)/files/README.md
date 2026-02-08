# File Manager

Cloud-based file management system with hierarchical folders.

**Live**: [jayantgoyal.com/files](https://jayantgoyal.com/files)

## Features

- Hierarchical folder structure with unlimited nesting
- File upload with progress tracking
- Copy, move, rename operations
- Soft delete with trash/restore functionality
- Breadcrumb navigation
- Grid and list view modes
- Context menu actions

## Tech Stack

- **Supabase Storage** - File blob storage
- **Supabase Database** - File/folder metadata
- **React DnD** - Drag and drop interactions
- **Catch-all routing** - `[[...path]]` for folder navigation

## How It Works

1. Files uploaded to Supabase Storage bucket
2. Metadata (name, path, parent) stored in database
3. Catch-all route `[[...path]]` handles folder navigation
4. Soft delete moves items to trash (restorable)
5. Hard delete removes from storage + database

## Files

```
src/
├── app/(protected)/files/
│   └── [[...path]]/
│       ├── page.tsx      # Server component
│       └── client.tsx    # File browser UI
├── lib/file-manager/
│   ├── database.ts       # DB operations
│   └── types.ts          # TypeScript types
└── app/api/files/
    ├── upload/           # Upload handling
    └── [id]/
        ├── copy/         # Copy file
        └── move/         # Move file
```

## Key Patterns

- **Catch-all routing**: `/files/folder1/folder2` maps to `[[...path]]`
- **Hierarchical data**: Parent-child relationships in DB
- **Optimistic UI**: Actions reflect immediately, sync in background
