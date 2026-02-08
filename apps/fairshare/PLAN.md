# Collaborative Finance Platform - Project Plan

**Project Name Ideas**: FairShare, SplitEasy, WeOwe, ShareTab, Divvy
**Type**: Full-stack web app (potential startup)
**Timeline**: 6+ months (ambitious scope)
**Stack**: New app in existing Turborepo monorepo

---

## 1. Project Overview

A collaborative finance platform focused on **group expense splitting** with real-time updates. Think Splitwise meets modern fintech - but friendlier, faster, and with better analytics.

### Core Value Proposition
- **For groups**: Effortlessly split expenses with roommates, couples, travel buddies
- **Real-time**: Instant balance updates when anyone adds an expense
- **Smart settlements**: Minimize transactions needed to settle up
- **Analytics**: Understand spending patterns individually and as a group

---

## 2. Tech Stack

### App Setup
- Add `apps/fairshare` (or chosen name) to existing Turborepo
- Reuse shared packages: `@repo/ui`, `@repo/tailwind-config`, `@repo/eslint-config`, `@repo/typescript-config`

### Core Technologies
| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, Radix UI, Framer Motion |
| Auth | Supabase Auth (email, OAuth, magic link) |
| Database | Supabase PostgreSQL |
| Real-time | Supabase Realtime (WebSocket subscriptions) |
| State | Zustand (with persist middleware) |
| Forms | React Hook Form + Zod validation |
| Charts | Recharts or Chart.js |
| Icons | Lucide React |
| Notifications | Sonner (toasts), Supabase for push |

### Future Integrations (Phase 2+)
- **Plaid** - Bank account linking
- **Resend** - Email notifications
- **OpenAI/Claude** - Receipt OCR & categorization
- **Stripe** - In-app payments between users

---

## 3. Feature Breakdown by Phase

### Phase 1: Foundation (Weeks 1-4)
**Goal**: Core auth, groups, and basic expense tracking

- [ ] Project scaffolding in Turborepo
- [ ] Authentication (signup, login, OAuth, password reset)
- [ ] User profiles (name, avatar, preferences)
- [ ] Create/join groups (invite via link or email)
- [ ] Add expenses (amount, description, category, date)
- [ ] Basic split methods (equal, exact amounts)
- [ ] View group balances (who owes whom)
- [ ] Expense list with filters

### Phase 2: Real-time & Settlements (Weeks 5-8)
**Goal**: Live updates and smart settlement suggestions

- [ ] Supabase Realtime subscriptions for expenses
- [ ] Real-time balance recalculation
- [ ] Live activity feed in groups
- [ ] Settlement suggestions (minimize transactions algorithm)
- [ ] Record settlements/payments
- [ ] Push notifications (new expense, payment received)
- [ ] Expense comments

### Phase 3: Analytics & Personal Finance (Weeks 9-12)
**Goal**: Insights and individual budgeting

- [ ] Spending analytics dashboard
- [ ] Category breakdown charts
- [ ] Monthly/yearly trends
- [ ] Personal budget categories with limits
- [ ] Spending alerts when approaching limits
- [ ] Export reports (CSV, PDF)
- [ ] Recurring expenses

### Phase 4: Advanced Features (Weeks 13-20)
**Goal**: Polish and advanced functionality

- [ ] Receipt photo upload with OCR
- [ ] Multi-currency support with conversion
- [ ] Expense templates (quick-add favorites)
- [ ] Group savings goals with progress
- [ ] Advanced split methods (percentage, shares, itemized)
- [ ] Expense approval workflows
- [ ] Search across all expenses

### Phase 5: Growth Features (Weeks 21+)
**Goal**: Startup-ready features

- [ ] Bank account linking (Plaid)
- [ ] In-app payments (Stripe Connect)
- [ ] PWA with offline support
- [ ] Native mobile apps (React Native or Expo)
- [ ] Referral system
- [ ] Premium tier features
- [ ] Admin dashboard for platform metrics

---

## 4. Database Schema (Supabase PostgreSQL)

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  currency TEXT DEFAULT 'USD',
  invite_code TEXT UNIQUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group memberships
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'admin' | 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Expense categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  is_default BOOLEAN DEFAULT FALSE
);

-- Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  paid_by UUID REFERENCES profiles(id),
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  date DATE DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  split_method TEXT DEFAULT 'equal', -- 'equal' | 'exact' | 'percentage' | 'shares'
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expense splits (who owes what)
CREATE TABLE expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  amount DECIMAL(12,2) NOT NULL, -- Amount this user owes
  is_settled BOOLEAN DEFAULT FALSE
);

-- Settlements (payments between users)
CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  from_user UUID REFERENCES profiles(id),
  to_user UUID REFERENCES profiles(id),
  amount DECIMAL(12,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments on expenses
CREATE TABLE expense_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personal budgets
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  category_id UUID REFERENCES categories(id),
  amount DECIMAL(12,2) NOT NULL,
  period TEXT DEFAULT 'monthly', -- 'weekly' | 'monthly' | 'yearly'
  UNIQUE(user_id, category_id, period)
);
```

---

## 5. Key Pages & Routes

```
/                     → Landing page (marketing)
/login                → Login
/signup               → Sign up
/auth/callback        → OAuth callback

(protected routes - require auth)
/dashboard            → Overview of all groups & balances
/groups               → List of user's groups
/groups/new           → Create new group
/groups/join/[code]   → Join via invite link
/groups/[id]          → Group detail (expenses, balances, members)
/groups/[id]/add      → Add expense
/groups/[id]/settle   → Settlement suggestions & record payment
/groups/[id]/settings → Group settings, members, invites

/expenses             → All expenses across groups
/expenses/[id]        → Expense detail with comments

/analytics            → Personal spending analytics
/budgets              → Personal budget management
/settings             → User settings, preferences
/settings/profile     → Edit profile
```

---

## 6. Key Algorithms

### Balance Calculation
For each group, calculate net balances:
```
For each user in group:
  balance = (sum of expenses they paid) - (sum of their splits across all expenses)

Positive balance = they are owed money
Negative balance = they owe money
```

### Settlement Minimization
Use a greedy algorithm to minimize number of transactions:
1. Separate users into creditors (positive balance) and debtors (negative balance)
2. Match largest debtor with largest creditor
3. Transfer min(debt, credit)
4. Update balances, repeat until all settled

---

## 7. Real-time Implementation

```typescript
// Subscribe to group expenses
const channel = supabase
  .channel(`group:${groupId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'expenses',
      filter: `group_id=eq.${groupId}`
    },
    (payload) => {
      // Update local state, recalculate balances
    }
  )
  .subscribe();
```

---

## 8. Verification & Testing

Since no test framework is configured:

### Manual Testing Checklist
- [ ] Create account, login, logout flow
- [ ] Create group, invite member via link
- [ ] Add expense with different split methods
- [ ] Verify balances update correctly
- [ ] Open in two browsers, verify real-time sync
- [ ] Record settlement, verify balances update
- [ ] Check analytics calculations
- [ ] Test on mobile viewport

### Commands
```bash
# Development
pnpm dev --filter fairshare

# Type check
pnpm check-types

# Lint
pnpm lint

# Build
pnpm build
```

---

## 9. Files to Create (Phase 1)

### App Structure
```
apps/fairshare/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (protected)/
│   │   │   ├── dashboard/
│   │   │   ├── groups/
│   │   │   ├── expenses/
│   │   │   └── settings/
│   │   ├── auth/
│   │   │   └── callback/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── expenses/
│   │   ├── groups/
│   │   ├── layout/
│   │   └── ui/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── utils/
│   │   └── hooks/
│   ├── stores/
│   └── types/
├── public/
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 10. Immediate Next Steps

1. **Choose final name** (FairShare, SplitEasy, WeOwe, etc.)
2. **Scaffold app** in Turborepo
3. **Set up Supabase project** with auth and initial tables
4. **Build auth flow** (reuse patterns from main app)
5. **Create group CRUD** operations
6. **Build expense form** with split logic
7. **Implement balance calculation**
8. **Add real-time subscriptions**

---

## Summary

This is an ambitious but achievable 6-month project that will:
- Demonstrate full-stack expertise (auth, real-time, complex state, analytics)
- Have real startup potential in a proven market
- Leverage your existing Turborepo setup and Supabase experience
- Build progressively from MVP to production-ready

Ready to start building?
