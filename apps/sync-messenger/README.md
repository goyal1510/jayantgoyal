# Sync Messenger

A cross-device messaging application that allows you to sync messages and code snippets across all your devices in real-time. Built with Next.js, Supabase, and TypeScript.

## Features

- 🔐 **Authentication**: Secure login/signup with Supabase Auth
- 📱 **Cross-Device Sync**: Messages sync in real-time across all your devices
- 💬 **Text Messages**: Send and receive regular text messages
- 💻 **Code Snippets**: Share code with proper syntax highlighting and indentation preservation
- 🎨 **Syntax Highlighting**: Support for 20+ programming languages
- 🌓 **Dark Mode**: Built-in dark mode support
- ⚡ **Real-time Updates**: Powered by Supabase Realtime

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from the project settings
3. Create a `.env.local` file in the app root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GUEST_EMAIL_LOGIN=your_guest_email
GUEST_PASSWORD_LOGIN=your_guest_password
```

### 3. Run Database Migration

Run the SQL migration file to create the messages table:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/001_create_messages_table.sql`
4. Run the migration

The migration will:
- Create the `messenger` schema (custom schema, not using public)
- Create the `messages` table with support for text and code messages
- Set up Row Level Security (RLS) policies
- Enable Realtime subscriptions
- Create indexes for optimal performance

### 4. Expose the Messenger Schema (REQUIRED)

For the custom schema to work with Supabase API, you **MUST** expose it:

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Scroll down to **Exposed schemas** section
4. Add `messenger` to the list of exposed schemas (comma-separated if there are multiple)
5. **Save the changes**
6. Wait a few seconds for the schema cache to refresh

### 5. Enable Realtime

1. Go to Database → Replication in your Supabase dashboard
2. Enable replication for the `messenger.messages` table (note: it's in the messenger schema)

### 6. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Sign Up**: Create a new account or log in with existing credentials
2. **Send Messages**: 
   - Toggle between "Text" and "Code" modes
   - For code messages, select the programming language
   - Paste your code (indentation is preserved)
   - Press Cmd/Ctrl + Enter to send
3. **View Messages**: All your messages appear in chronological order
4. **Cross-Device**: Open the app on multiple devices - messages sync automatically!

## API Routes

The app includes RESTful API routes for message operations:

- **GET /api/messages** - Fetch all messages for the authenticated user
- **POST /api/messages** - Create a new message
  ```json
  {
    "content": "Your message content",
    "message_type": "text" | "code",
    "language": "javascript" // optional, required for code messages
  }
  ```
- **PATCH /api/messages/[id]** - Update an existing message
- **DELETE /api/messages/[id]** - Delete a message

All API routes:
- Require authentication
- Use the `messenger` schema
- Enforce RLS policies (users can only access their own messages)
- Return proper error responses

## Database Schema

The app uses a custom `messenger` schema (not the default `public` schema).

### Messages Table (messenger.messages)

```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- content: TEXT (message content)
- message_type: TEXT ('text' or 'code')
- language: TEXT (optional, for code messages)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**Schema**: `messenger` (custom schema)

## Tech Stack

- **Framework**: Next.js 16
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Syntax Highlighting**: react-syntax-highlighter
- **Type Safety**: TypeScript

## Project Structure

```
sync-messenger/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── (protected)/  # Protected routes with sidebar
│   │   ├── api/          # API routes
│   │   ├── login/        # Login page
│   │   └── signup/       # Signup page
│   ├── components/       # React components
│   │   ├── ui/          # Reusable UI components
│   │   ├── message-*.tsx # Message-related components
│   │   └── ...
│   └── lib/              # Utilities and Supabase clients
├── supabase/
│   └── migrations/       # Database migrations
└── ...
```

## Security

- Row Level Security (RLS) is enabled on the messages table
- Users can only view, create, update, and delete their own messages
- All authentication is handled securely by Supabase

## License

Private project - All rights reserved
