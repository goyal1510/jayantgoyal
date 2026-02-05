# JDKSK — Web-Based Accounting Software (Tally-like)

## Vision

A modern, web-based accounting and business management platform inspired by TallyPrime. Built as a Next.js app inside the existing Turborepo monorepo, using Supabase as the backend.

---

## Phase 0: Project Scaffolding

- [ ] Initialize Next.js 16 app at `apps/jdksk/` (React 19, App Router)
- [ ] Wire into the monorepo (`pnpm-workspace.yaml` already covers `apps/*`)
- [ ] Reuse shared packages: `@repo/ui`, `@repo/tailwind-config`, `@repo/eslint-config`, `@repo/typescript-config`
- [ ] Set up Supabase project (or reuse existing one with a separate schema/tables)
- [ ] Set up environment variables in `turbo.json` and `.env.local`
- [ ] Add basic auth (login/signup) — reuse Supabase auth patterns from the main app

---

## Phase 1: Core Data Model (Database Schema)

This is the foundation. Everything in accounting revolves around these entities.

### 1.1 Company / Organization

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | Company name |
| address | jsonb | Street, city, state, pin, country |
| gstin | text | GST number (nullable) |
| pan | text | PAN (nullable) |
| financial_year_start | date | e.g. 2025-04-01 |
| currency | text | Default: INR |
| owner_id | uuid | FK → auth.users |
| created_at | timestamptz | |

A user can own multiple companies. All data is scoped to a company.

### 1.2 Ledger (Account)

The heart of double-entry bookkeeping.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| company_id | uuid | FK → companies |
| name | text | e.g. "Cash", "HDFC Bank", "Sales A/c" |
| group_id | uuid | FK → ledger_groups |
| opening_balance | numeric(15,2) | |
| balance_type | text | "Dr" or "Cr" |
| gstin | text | For party ledgers |
| address | jsonb | For party ledgers |
| created_at | timestamptz | |

### 1.3 Ledger Groups (Account Groups)

Tally's group hierarchy. Pre-seed with standard groups.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| company_id | uuid | FK → companies |
| name | text | e.g. "Current Assets", "Sundry Debtors" |
| parent_id | uuid | FK → self (nullable, for hierarchy) |
| nature | text | "Assets", "Liabilities", "Income", "Expense" |
| is_system | boolean | true for pre-seeded groups (non-deletable) |

**Pre-seeded groups** (mirroring Tally):
- Capital Account, Current Assets, Current Liabilities, Fixed Assets
- Sundry Debtors, Sundry Creditors, Bank Accounts, Cash-in-Hand
- Direct Income, Indirect Income, Direct Expenses, Indirect Expenses
- Sales Accounts, Purchase Accounts, Duties & Taxes
- Loans (Asset), Loans (Liability), Investments, etc.

### 1.4 Voucher (Transaction)

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| company_id | uuid | FK → companies |
| voucher_type | text | "sales", "purchase", "payment", "receipt", "journal", "contra", "credit_note", "debit_note" |
| voucher_number | text | Auto-generated per type per FY |
| date | date | Transaction date |
| narration | text | Description |
| is_cancelled | boolean | Soft delete |
| created_by | uuid | FK → auth.users |
| created_at | timestamptz | |

### 1.5 Voucher Entry (Line Items)

Each voucher has multiple debit/credit entries (double-entry).

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| voucher_id | uuid | FK → vouchers |
| ledger_id | uuid | FK → ledgers |
| amount | numeric(15,2) | Always positive |
| type | text | "Dr" or "Cr" |
| cost_center_id | uuid | FK → cost_centers (nullable) |

**Constraint**: Sum of Dr entries = Sum of Cr entries per voucher.

### 1.6 Inventory (Phase 2 — optional initially)

| Table | Purpose |
|---|---|
| stock_groups | Hierarchy of stock groups |
| stock_items | Products/items with unit, rate, tax |
| stock_units | Units of measurement (kg, pcs, etc.) |
| godowns | Warehouses/locations |
| voucher_inventory_entries | Links voucher entries to stock movements |

### 1.7 Tax Configuration

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| company_id | uuid | FK |
| name | text | "GST 18%", "GST 5%", "IGST 18%" |
| rate | numeric(5,2) | Percentage |
| type | text | "CGST", "SGST", "IGST", "CESS" |

---

## Phase 2: Core Features (MVP)

Build these in order. Each builds on the previous.

### 2.1 Company Management
- Create / switch between companies
- Company settings (name, address, GSTIN, FY)
- Multi-company support from day one

### 2.2 Chart of Accounts (Ledgers & Groups)
- View group tree (collapsible hierarchy)
- Create / edit / delete ledger groups
- Create / edit / delete ledgers
- Assign ledgers to groups
- Opening balance entry
- Search/filter ledgers

### 2.3 Voucher Entry
This is the most critical feature — equivalent to Tally's voucher entry screen.

**Voucher types to implement:**
1. **Payment** (Cash/Bank pays someone) — Dr: Expense/Party, Cr: Cash/Bank
2. **Receipt** (Cash/Bank receives) — Dr: Cash/Bank, Cr: Income/Party
3. **Journal** (General adjustments) — Dr: Any, Cr: Any
4. **Contra** (Fund transfers) — Dr: Bank, Cr: Cash (or vice versa)
5. **Sales** (Invoice) — Dr: Party, Cr: Sales + Tax ledgers
6. **Purchase** (Bill) — Dr: Purchase + Tax ledgers, Cr: Party
7. **Credit Note** (Sales return)
8. **Debit Note** (Purchase return)

**Voucher entry UX:**
- Keyboard-first navigation (Tab, Enter to move between fields — like Tally)
- Auto-complete ledger names as you type
- Real-time Dr/Cr balance check
- Narration field
- Date picker with shortcut keys
- Voucher number auto-generation

### 2.4 Day Book
- List all vouchers for a date/date range
- Filter by voucher type
- Click to view/edit voucher

### 2.5 Ledger Reports
- **Ledger Account**: Show all transactions for a ledger with running balance
- **Group Summary**: Totals by group
- Date range filter on everything

---

## Phase 3: Financial Reports

### 3.1 Trial Balance
- List all ledgers with their Dr/Cr totals
- Grouped by account group
- Date range filter
- Drill-down: click ledger → see transactions

### 3.2 Profit & Loss Statement
- Income minus Expenses for a period
- Grouped by account nature
- Opening stock / Closing stock entries (if inventory enabled)

### 3.3 Balance Sheet
- Assets vs Liabilities + Capital
- As on a specific date
- Grouped by account group hierarchy

### 3.4 Cash Flow Statement
- Receipts and Payments summary
- Grouped by activity type

### 3.5 Outstanding Reports
- **Receivables** (Sundry Debtors with ageing)
- **Payables** (Sundry Creditors with ageing)
- Bill-by-bill tracking (which invoices are unpaid)

---

## Phase 4: GST & Tax Compliance

### 4.1 GST Reports
- GSTR-1 (Outward supplies — Sales)
- GSTR-3B (Summary return)
- HSN-wise summary
- Tax ledger reports (CGST, SGST, IGST breakdowns)

### 4.2 Invoice Printing
- GST-compliant invoice template
- Customizable header/footer
- PDF generation (using `@react-pdf/renderer` or similar)
- Print-friendly layout

---

## Phase 5: Advanced Features (Post-MVP)

### 5.1 Inventory Management
- Stock groups, items, units
- Stock movement with vouchers
- Stock summary report
- Godown/warehouse management
- Batch & expiry tracking

### 5.2 Cost Centers
- Create cost centers
- Allocate voucher entries to cost centers
- Cost center reports

### 5.3 Multi-Currency
- Foreign currency ledgers
- Exchange rate management
- Forex gain/loss calculation

### 5.4 Budgets
- Set budgets per ledger/group
- Budget vs Actual reports
- Variance analysis

### 5.5 Bank Reconciliation
- Import bank statements (CSV/OFX)
- Match with recorded transactions
- Reconciliation report

### 5.6 Payroll (optional)
- Employee master
- Salary components
- Payslip generation
- PF/ESI calculations

### 5.7 Audit Trail
- Log every create/update/delete
- Who changed what, when
- Immutable audit log table

---

## Tech Stack & Architecture

### Frontend
| Concern | Choice | Reason |
|---|---|---|
| Framework | Next.js 16 (App Router) | Already in monorepo |
| UI | `@repo/ui` + Radix UI + Tailwind | Reuse existing components |
| State | Zustand + persist | Consistent with main app |
| Tables | TanStack Table v8 | Powerful, headless, needed for ledgers/reports |
| Forms | React Hook Form + Zod | Voucher entry needs robust form handling |
| Charts | Recharts or Chart.js | For dashboard/reports |
| PDF | `@react-pdf/renderer` | Invoice generation |
| Keyboard nav | Custom hooks | Tally-like keyboard-first UX |

### Backend
| Concern | Choice | Reason |
|---|---|---|
| Database | Supabase (PostgreSQL) | Already used, RLS for multi-tenancy |
| Auth | Supabase Auth | Already set up |
| API | Next.js Route Handlers | Consistent pattern |
| Realtime | Supabase Realtime | For multi-user sync (optional) |
| Storage | Supabase Storage | For invoice PDFs, attachments |

### Database Design Principles
- **Row-Level Security (RLS)**: All tables scoped by `company_id`. Users only see data for companies they own/have access to.
- **Double-entry integrity**: Database constraint ensuring Dr = Cr per voucher.
- **Soft deletes**: Vouchers are cancelled, never deleted (audit trail).
- **Numeric precision**: `numeric(15,2)` for all money fields. Never use `float`.
- **Financial year isolation**: Reports always scoped to a financial year.

---

## Folder Structure

```
apps/jdksk/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Login, signup
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (app)/               # Authenticated layout (sidebar + header)
│   │   │   ├── dashboard/       # Overview, quick stats
│   │   │   ├── company/         # Company settings
│   │   │   ├── accounts/        # Ledgers & Groups (Chart of Accounts)
│   │   │   │   ├── ledgers/
│   │   │   │   └── groups/
│   │   │   ├── vouchers/        # Voucher entry & list
│   │   │   │   ├── new/
│   │   │   │   ├── [id]/
│   │   │   │   └── types/       # Payment, Receipt, Sales, etc.
│   │   │   ├── reports/
│   │   │   │   ├── trial-balance/
│   │   │   │   ├── profit-loss/
│   │   │   │   ├── balance-sheet/
│   │   │   │   ├── cash-flow/
│   │   │   │   ├── daybook/
│   │   │   │   ├── ledger/
│   │   │   │   └── outstanding/
│   │   │   ├── gst/
│   │   │   │   ├── gstr1/
│   │   │   │   └── gstr3b/
│   │   │   ├── inventory/       # Phase 5
│   │   │   └── settings/
│   │   ├── api/
│   │   │   ├── vouchers/
│   │   │   ├── ledgers/
│   │   │   ├── reports/
│   │   │   └── company/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── voucher-form/        # The big one — Tally-like entry
│   │   ├── ledger-tree/         # Collapsible account group tree
│   │   ├── report-viewer/       # Reusable report table with drill-down
│   │   ├── company-switcher/
│   │   └── keyboard-nav/        # Keyboard navigation hooks
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   ├── accounting/
│   │   │   ├── double-entry.ts  # Validation: Dr = Cr
│   │   │   ├── voucher-numbers.ts
│   │   │   └── calculations.ts  # Balance, totals, tax
│   │   └── utils.ts
│   ├── stores/
│   │   ├── company-store.ts     # Active company
│   │   └── voucher-store.ts     # Draft voucher state
│   └── types/
│       ├── ledger.ts
│       ├── voucher.ts
│       └── reports.ts
├── public/
├── next.config.ts
├── package.json
├── tsconfig.json
└── PLAN.md
```

---

## Implementation Order (Recommended)

### Sprint 1 — Foundation (Week 1-2)
1. Scaffold Next.js app, wire into monorepo
2. Set up auth (login/signup/session)
3. Create database tables: companies, ledger_groups, ledgers
4. Company create/switch UI
5. Pre-seed default ledger groups
6. Ledger CRUD (create, list, edit, delete)
7. Group tree view

### Sprint 2 — Voucher Entry (Week 3-4)
1. Create database tables: vouchers, voucher_entries
2. Build the voucher entry form (the hardest UI piece)
   - Multi-line Dr/Cr entry
   - Ledger autocomplete
   - Real-time balance validation
   - Keyboard navigation
3. Voucher list (Day Book)
4. Voucher view/edit
5. All 8 voucher types working

### Sprint 3 — Reports (Week 5-6)
1. Ledger report (transactions + running balance)
2. Trial Balance
3. Profit & Loss
4. Balance Sheet
5. Group summary
6. Date range filters on all reports
7. Drill-down navigation (report → ledger → voucher)

### Sprint 4 — GST & Polish (Week 7-8)
1. Tax configuration (GST rates)
2. GST-aware sales/purchase vouchers
3. GSTR-1 report
4. GSTR-3B report
5. Invoice PDF generation
6. Dashboard with quick stats
7. Outstanding reports (receivables/payables)

### Sprint 5+ — Advanced (Ongoing)
- Inventory management
- Cost centers
- Bank reconciliation
- Multi-currency
- Data export (Excel/CSV)
- Data import from Tally (XML)
- Mobile responsive design

---

## Key UX Principles (Lessons from Tally)

1. **Keyboard-first**: Power users should never need a mouse. Tab between fields, Enter to confirm, Esc to go back. Shortcut keys for voucher types (F5 = Payment, F6 = Receipt, etc.).

2. **Speed over beauty**: Voucher entry must be fast. Minimize clicks, maximize keyboard flow. Autocomplete everything.

3. **Drill-down everywhere**: Every number in a report should be clickable to see its breakdown. Trial Balance → Ledger → Voucher.

4. **Real-time validation**: Dr must equal Cr before saving. Show the difference live.

5. **Forgiving input**: Date entry should accept "1/4" and expand to "01/04/2025". Amount fields should accept basic math ("1000+500").

6. **Print-ready reports**: Every report should have a clean print layout.

---

## What You Need Before Starting

- [ ] Supabase project (new or existing)
- [ ] Decide on app name / branding (rename from "jdksk" to something meaningful?)
- [ ] Basic understanding of double-entry bookkeeping (Dr/Cr rules)
- [ ] Decide: Indian-market focused (GST) or generic/international?
- [ ] Decide: Single-user or multi-user per company?

---

## Open Questions

1. **App name?** — "jdksk" is a placeholder. What should this be called?
2. **Market focus?** — India-specific (GST, TDS, Indian FY April-March) or international?
3. **Multi-user?** — Should multiple users be able to work on the same company? (adds complexity: roles, permissions, realtime sync)
4. **Separate Supabase project?** — Use the existing one or create a new dedicated one?
5. **Inventory from day one?** — Or accounting-only for MVP?
