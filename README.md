# FlatSplit 🏠⚡

> **Smart shared expense management for flatmates** — Split costs, track debts, and settle up with ease.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## ✨ Features

- 🔐 **Auth** — Email/password sign-up with Supabase Auth
- 🏠 **Flat Management** — Create a flat or join via 6-char invite code (max 5 members)
- 💸 **Expense Splitting** — Equal, percentage, or custom splits with category tagging
- 🧮 **Debt Simplification** — Greedy min-cash-flow algorithm minimises total transactions
- 📊 **Analytics** — Area trend chart, category pie, member bar chart (Recharts)
- ✅ **Settlement Tracking** — Mark payments, add notes, auto-recalculate balances
- 🔔 **Notifications** — In-app bell with real-time unread count
- 🎭 **Demo Mode** — Try the full app at `/demo/dashboard` without signing up
- 🌙 **Dark/Light mode** — Glassmorphism UI, smooth Framer Motion animations
- 📱 **Mobile-first** — Bottom navigation bar, responsive layouts

---

## 🚀 Quick Start

### 1. Clone & install
```bash
git clone <your-repo>
cd flatsplit
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → run `supabase/schema.sql`
3. Then run `supabase/rls.sql`
4. (Optional) Run `supabase/seed.sql` for demo data

### 3. Configure environment
```bash
cp .env.local.example .env.local
```

Fill in your values from **Supabase Dashboard → Settings → API**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run locally
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → click **Try Demo** to explore immediately.

---

## 🌐 Deploy to Vercel (Free)

1. Push your repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → import your repo
3. Add the three environment variables from your `.env.local`
4. Click **Deploy** — done!

> The app uses Next.js API Routes (no separate backend needed). Vercel's free Hobby plan handles all traffic for a 5-person flat.

---

## 🗄️ Database Schema

| Table | Purpose |
|---|---|
| `profiles` | Extended user data (name, avatar) |
| `flats` | Flat metadata + invite code |
| `flat_members` | Many-to-many: users ↔ flats + role |
| `categories` | Expense categories (seeded) |
| `expenses` | Individual expenses |
| `expense_participants` | Per-user share per expense |
| `settlements` | Recorded payments between members |
| `notifications` | In-app notification log |

All tables use **Row Level Security** — users only see data from their own flat.

---

## 🧮 Debt Simplification Algorithm

Implements a **greedy min-cash-flow** approach:

1. Compute each member's net balance (`totalPaid − totalShare`)
2. Sort: largest debtor ↔ largest creditor
3. Create a single transaction between them, reduce both balances
4. Repeat until all balances are ~0

**Example:** Instead of A→B ₹1000, B→C ₹1000, the algorithm outputs A→C ₹1000 (1 transaction instead of 2).

---

## 📁 Project Structure

```
app/
  page.tsx               # Landing page
  (auth)/
    login/page.tsx        # Login
    signup/page.tsx       # Signup (2-step)
  (app)/
    dashboard/page.tsx   # Real dashboard (auth required)
    expenses/page.tsx    # Expense list
    expenses/add/        # Add expense form
    analytics/page.tsx   # Charts & analytics
    settlements/page.tsx # Settlement system
    members/page.tsx     # Member management
  demo/                  # Full app in demo mode (no auth)
  api/                   # Route handlers (future extensions)

components/
  layout/               # Sidebar, Header, MobileNav, AppShell
  dashboard/            # SummaryCards, BalanceTable, Suggestions
  expenses/             # ExpensesClient, AddExpenseClient
  analytics/            # AnalyticsClient (Recharts)
  settlements/          # SettlementsClient
  members/              # MembersClient

lib/
  supabase/             # client.ts + server.ts
  algorithms/           # debt-simplifier.ts
  demo-data.ts          # Seed data for demo mode
  utils.ts              # formatCurrency, getInitials, etc.

supabase/
  schema.sql            # All tables + triggers + indexes
  rls.sql               # Row Level Security policies
  seed.sql              # Demo data for real DB
```

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + CSS variables |
| UI Components | shadcn/ui (Radix UI) |
| Animations | Framer Motion |
| Charts | Recharts |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL |
| Deployment | Vercel (free) |

---

## 🆓 Free Tier Limits

| Service | Free Limit | FlatSplit Usage |
|---|---|---|
| Supabase DB | 500 MB | ~10 MB for years |
| Supabase Auth | 50,000 MAU | 5 users |
| Supabase Storage | 1 GB | Receipt images |
| Vercel Deployments | 100/day | Plenty |
| Vercel Bandwidth | 100 GB/month | ~1 GB |

**All well within free limits for a 5-person flat.**

---

## 📄 License

MIT — do whatever you want with it.
