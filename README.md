# DuoHub

A shared finance and task tracker for two people. Track expenses, monthly budgets, savings goals, and to-dos together — with realtime sync between devices.

Built with React 19, Vite, Tailwind CSS 4, Recharts, and Supabase. Installable as a PWA on mobile.

## Features

- **Dashboard** — monthly financial snapshot: income, savings target, safe-to-spend budget with progress bar, budget breakdown chart, quick expense logging, and upcoming tasks.
- **Expenses** — full history grouped by month, filterable, with category icons and who-paid indicators.
- **To-Dos** — shared or per-person tasks with due dates, filters, and overdue warnings.
- **Analytics** — fixed vs variable spending breakdown with saving suggestions.
- **Profile** — set each month's income/savings plan, customize names, enable device notifications.
- **Notifications** — due-task alerts in the device notification bar (once per day).
- **Realtime sync** — changes made by one person appear instantly on the other's device (requires database setup).
- **Offline-first PWA** — installable on the home screen; works without a connection using local storage.

## Getting started

```bash
npm install
npm run dev
```

The app runs fully on localStorage out of the box (the sync dot next to the logo shows gray = "local only").

## Database setup (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** in the Supabase dashboard, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**. This creates all tables, enables realtime, and seeds the initial data.
3. Copy `.env.example` to `.env.local` and fill in your values from **Project Settings → API**:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
4. Restart the dev server. The sync dot turns green when connected.

## Deployment (free)

Push to GitHub, then import the repo at [vercel.com](https://vercel.com) (or Netlify). Vite is auto-detected. Add the two `VITE_SUPABASE_*` environment variables in the project settings so the deployed app can reach the database.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (also generates the PWA service worker) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run oxlint |
