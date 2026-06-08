# Prompt: Recreate the Deco Admin Dashboard

Use this prompt to recreate the admin environment exactly as it exists. Copy everything below the line into a new conversation.

---

## Project Context

Build an admin dashboard for **Deco**, a hockey development coaching app. The admin dashboard is part of a Next.js landing site that also serves the public homepage, privacy policy, and data deletion pages.

**Tech Stack:**
- Next.js 16 (App Router) + React 19 + TypeScript 5.9
- Tailwind CSS 4 with custom design tokens
- Supabase (Auth SSR + Postgres with `deco` schema)
- Recharts 3.8 for charts
- date-fns 4 for date handling
- Deployed on Vercel

**Supabase Config:**
- Project URL and anon key as `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Service role key as `SUPABASE_SERVICE_ROLE_KEY` (server-side only, bypasses RLS)
- All tables are in the `deco` schema (not public)
- Admin check via `deco.is_admin()` Postgres function

---

## Architecture

### Authentication
- **Middleware** (`middleware.ts`): Protects all `/admin/*` routes except `/admin/login`. Uses Supabase SSR to check auth cookies. Redirects unauthenticated users to `/admin/login`.
- **Login page** (`app/admin/login/page.tsx`): Standalone `'use client'` page with email/password form using browser Supabase client. On success, redirects to `/admin`.
- **Admin verification** (`lib/admin-auth.ts`): `verifyAdmin()` async function used in every API route. Creates a Supabase SSR server client from cookies, calls `supabase.auth.getUser()`, then `supabase.rpc('is_admin')`. Returns `{id, email}` or `null`.
- **Supabase clients**:
  - `lib/supabase/client.ts`: Browser client for login form (`createBrowserClient`)
  - `lib/supabase/server.ts`: `createAdminClient()` using service role key, `{db: {schema: 'deco'}}`. Used in all API routes.

### Route Structure
```
app/admin/
├── layout.tsx                    # Root passthrough (just renders children)
├── login/page.tsx                # Login form (not wrapped by dashboard layout)
└── (dashboard)/                  # Route group — all pages share dashboard layout
    ├── layout.tsx                # Server component: verifyAdmin(), renders Sidebar + topbar + main area
    ├── page.tsx                  # Overview
    ├── users/page.tsx
    ├── engagement/page.tsx
    ├── gamification/page.tsx
    ├── coaches/page.tsx
    ├── training/page.tsx
    ├── funnel/page.tsx
    ├── goal-insights/page.tsx
    ├── power-users/page.tsx
    ├── notifications/page.tsx
    ├── notifications/templates/page.tsx
    ├── app-store/page.tsx
    ├── app-store/screenshots/page.tsx
    ├── app-store/feature-graphic/page.tsx
    ├── brand-key/page.tsx
    └── icon-preview/page.tsx
```

### Dashboard Layout (`app/admin/(dashboard)/layout.tsx`)
Server component that:
1. Calls `verifyAdmin()` — redirects to `/admin/login` if not admin
2. Renders fixed 240px Sidebar on the left
3. Main area with: 64px topbar (page title + admin email + LogoutButton) + scrollable content area

---

## Design Tokens (in `app/globals.css` via `@theme`)

```css
--color-deco-primary: #1B6B4A;
--color-deco-primary-light: #2D9B6A;
--color-deco-primary-dark: #0F4A32;
--color-deco-accent: #F5A623;
--color-deco-accent-light: #FFD080;
--color-deco-bg: #F8FAF9;
--color-deco-surface: #FFFFFF;
--color-deco-surface-secondary: #F0F4F2;
--color-deco-text: #1A1A2E;
--color-deco-text-secondary: #6B7280;
--color-deco-text-tertiary: #9CA3AF;
--color-deco-border: #E5E7EB;
--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
```

Use these as Tailwind classes: `bg-deco-primary`, `text-deco-text-secondary`, etc.

---

## Shared Components (`components/admin/`)

### Sidebar.tsx
`'use client'` — fixed left sidebar (w-60, h-screen, bg-deco-primary-dark). Contains:
- Logo (SVG green rounded rect + white D)
- Nav items array with label, href, inline SVG icon
- Active state: `pathname === href` for `/admin`, `pathname.startsWith(href)` for sub-routes
- Active: `bg-white/15 text-white`, icon `text-deco-accent-light`
- Inactive: `text-white/60 hover:bg-white/8`
- Footer with copyright

**Nav items (in order):** Overview, Users, Engagement, Gamification, Coaches, Training, Funnel, Goal Insights, Power Users, Notifications, App Store, Brand Key

### StatCard.tsx
Props: `{title: string, value: string|number, subtitle?: string, trend?: {value: number, label: string}, icon?: ReactNode}`
- Card: `bg-deco-surface rounded-xl border border-deco-border p-5`
- Trend badge: green ↑ or red ↓

### ChartCard.tsx
Props: `{title: string, subtitle?: string, children: ReactNode, className?: string}`
- Header with border-b, flex-1 content area with p-4

### TimeRangeSelector.tsx
`'use client'` — Props: `{value: string, onChange: (v: string) => void}`
- Pill buttons: 7d, 30d, 90d, All
- Active: `bg-deco-primary text-white`, inactive: `text-deco-text-secondary hover:bg-deco-bg`

### LoadingState.tsx
Props: `{cards?: number}` (default 4)
- Animated pulse skeleton cards in responsive grid

### LogoutButton.tsx
`'use client'` — calls `supabase.auth.signOut()`, redirects to `/admin/login`

### FunnelChart.tsx
Props: `{stages: {label, value, percentage}[]}`
- Horizontal bars width = percentage%, with drop-off annotations

### DataTable.tsx
Props: `{columns: {key, label, align}[], data: Record[]}`
- Zebra rows, horizontal scroll, responsive

---

## Page Pattern (every dashboard page follows this)

```typescript
'use client';
import { useState, useEffect } from 'react';
import StatCard from '@/components/admin/StatCard';
import ChartCard from '@/components/admin/ChartCard';
import TimeRangeSelector from '@/components/admin/TimeRangeSelector';
import LoadingState from '@/components/admin/LoadingState';

export default function SomePage() {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState<SomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/data?range=${range}`)
      .then(r => r.json())
      .then(json => { setData(json.someSection); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [range]);

  if (loading) return <LoadingState />;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-deco-text">Page Title</h1>
        <TimeRangeSelector value={range} onChange={setRange} />
      </div>
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Metric" value={data.metric} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ChartCard title="Chart">{/* Recharts here */}</ChartCard>
      </div>
    </div>
  );
}
```

---

## API Route Pattern

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const range = req.nextUrl.searchParams.get('range') ?? '30d';
  const supabase = createAdminClient();

  // Query deco schema tables (RLS bypassed via service role)
  const { data, error } = await supabase.from('some_table').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}
```

---

## Dashboard Pages Summary

| Page | Route | Data Source | Key Visuals |
|------|-------|-------------|-------------|
| Overview | `/admin` | `/api/admin/data` | 6 stat cards, signup AreaChart, DAU LineChart |
| Users | `/admin/users` | `/api/admin/data` | Signup/DAU charts, sortable user table |
| Engagement | `/admin/engagement` | `/api/admin/data` | Goals BarChart, status PieChart, reflections, AI scores |
| Gamification | `/admin/gamification` | `/api/admin/data` | XP distribution, achievements, streaks |
| Coaches | `/admin/coaches` | `/api/admin/data` | Comments timeseries, team sizes, active coaches table |
| Training | `/admin/training` | `/api/admin/data` | Sessions per day, completion rate, difficulty |
| Funnel | `/admin/funnel` | `/api/admin/data` | FunnelChart (6 stages), drop-off %, stat cards |
| Goal Insights | `/admin/goal-insights` | `/api/admin/data` | Specificity/measurability/challenge scores |
| Power Users | `/admin/power-users` | `/api/admin/data` | 5 segments, RadarChart, feature adoption, athlete table |
| Notifications | `/admin/notifications` | `/api/admin/notifications` | Send form, user table with push tokens, template management |
| App Store | `/admin/app-store` | `/api/admin/app-store` | GitHub releases, screenshots generator |
| Brand Key | `/admin/brand-key` | `/api/admin/brand-key` | Color palette, logo assets |

---

## Notifications System

The notifications page has two sub-features:

### Send Notifications (`/admin/notifications`)
- Fetches users with push tokens from `deco.profiles` (only `onboarding_completed = true`)
- Emails fetched via `supabase.auth.admin.listUsers()` (try-catch, non-fatal)
- Type dropdown: Pre-training focus, Post-training reflection, Coach feedback, Weekly reflection, Coach weekly report, Custom
- Destination screen dropdown populated from `appScreens` array
- Language selector (NL/EN) that pre-fills title/body from template defaults
- Custom URL field for external links
- Sends via Expo Push API (`https://exp.host/--/api/v2/push/send`)

### Manage Templates (`/admin/notifications/templates`)
- CRUD for `deco.notification_templates` table
- Templates grouped by type, with per-language (NL/EN) rows
- Each row: title input, body textarea, screen_path dropdown
- Edit/Save per card, dirty state tracking
- Coach feedback has two variants: `thumbs_up` and `comment` (with `{{goal}}` placeholder)

---

## Database Tables Referenced

Key `deco` schema tables used by admin:
- `profiles` — id, full_name, role, push_token, notification_prefs, onboarding_completed, position, language, last_active_at, created_at
- `goals` — id, athlete_id, title, description, status, ai_analysis, skill_id, created_at
- `reflections` — id, athlete_id, session_id, created_at
- `xp_events` — id, athlete_id, event_type, points, created_at
- `achievements` / `athlete_achievements` — achievement definitions + earned records
- `scheduled_sessions` — id, athlete_id, date, start_time, end_time, session_type, reflection_id, notification_sent_pre/post
- `training_schedules` — recurring weekly schedule templates
- `team_members` / `team_coaches` / `teams` — team relationships
- `coach_comments` — id, coach_id, goal_id, content, is_thumbs_up, seen_by_athlete, notification_sent
- `notification_templates` — id, type, variant, language, title, body, screen_path
- `athlete_attributes` — skill radar scores over time
- `skill_definitions` / `athlete_skills` — skill catalog + selections

Admin functions (SECURITY DEFINER):
- `is_admin()` — returns boolean
- `get_analytics(range_days)` — returns full analytics JSON
- `get_team_leaderboard(team_id)` — returns leaderboard data
- `get_athlete_xp(athlete_id)` — returns XP total
