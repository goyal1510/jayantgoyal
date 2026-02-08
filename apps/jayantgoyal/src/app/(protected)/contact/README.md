# Contact Form

Contact form with email delivery.

**Live**: [jayantgoyal.com/contact](https://jayantgoyal.com/contact)

## Features

- Name, email, message fields
- Form validation
- Email delivery via Resend
- Success/error feedback
- Rate limiting

## Tech Stack

- **Resend** - Email delivery service
- **React 19** - Form UI
- **Sonner** - Toast notifications

## How It Works

1. User fills out contact form
2. Client-side validation
3. Form submitted to API route
4. Server validates and sends email via Resend
5. Success/error toast displayed

## Files

```
src/
├── app/(protected)/contact/
│   ├── page.tsx              # Server component
│   └── client.tsx            # Contact form UI
└── app/api/contact/
    └── route.ts              # Email sending API
```

## API Route

```typescript
// POST /api/contact
{
  name: string,
  email: string,
  message: string
}
```

## Environment Variables

```env
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```
