# Nurse Ward Allocator

Hospital ward assignment app using **Serial Priority with Lottery cascade**. Staff view department allocation dashboards; admins manage department slot capacities and run assignment rounds with server-side lottery tie-breakers.

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Backend:** Supabase (Postgres, Auth, Realtime, Edge Functions)
- **Hosting:** Vercel (recommended) or Netlify
- **Source control:** GitHub

## Features

- Hospital staff roles (ADMIN, managers, supervisors, head ward nurses) with department / LOF-scoped dashboard
- Pre-seeded staff accounts (no public registration)
- Login with **7-digit nurse ID + password** (most staff: password equals ID)
- Admins edit department slot capacities and run assignment rounds
- Participants (future) submit three ranked department preferences
- Server-side assignment engine with tier cascade (1st → 2nd → 3rd)
- Uniform random lottery when demand exceeds capacity
- Real-time result updates via Supabase Realtime
- Lottery audit log with seed hashes
- CSV export for assignments and waitlist

## Local development

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/nurse-ward-allocator.git
cd nurse-ward-allocator
npm install
```

### 2. Configure Supabase

1. Create a free project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Copy `.env.example` to `.env` and fill in:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Run migrations in the Supabase SQL editor (in order):
   - `supabase/migrations/20260707120000_initial_schema.sql`
   - `supabase/migrations/20260707130000_nurse_id_login.sql`
   - `supabase/migrations/20260707140000_hospital_staff_departments.sql`
   - `supabase/migrations/20260707150000_participant_name_login.sql`

### 3b. Seed hospital staff (one time)

Set service-role credentials locally (never commit these):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Then run:

```bash
node scripts/seed-staff.mjs
```

Staff data lives in `scripts/data/staff-seed.json`. The script is idempotent — safe to re-run after edits.

In Supabase → **Authentication** → **Providers**, **disable public sign-ups** so only seeded accounts can log in.

### 3c. Seed participants (name-based login)

Until 7-digit nurse IDs are issued, participants sign in by **choosing their full name** from a dropdown.

```bash
node scripts/seed-participants.mjs
```

Names live in `scripts/data/participants-seed.json`. Default shared password: `allocate2026` (override with `PARTICIPANT_DEFAULT_PASSWORD`).

Share that temporary password with participants through your coordinator. When real nurse IDs are ready, accounts can be migrated to ID-based login.

### 3. Deploy the Edge Function

Install the [Supabase CLI](https://supabase.com/docs/guides/cli), then:

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy run-assignment
```

The function uses `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` automatically in the hosted environment.

### 4. Enable Realtime

In Supabase Dashboard → **Database** → **Replication**, enable Realtime for:

- `assignment_rounds`
- `assignments`
- `waitlist`
- `lottery_events`

### 5. Admin account

After seeding, sign in as nurse ID `5650414` with the admin password from your staff list. Admins land on **Rounds** and can edit **Departments** slot capacities.

To promote another admin manually:

```sql
UPDATE public.profiles
SET role = 'ADMIN'
WHERE nurse_id = '1234567';
```

### 6. Auth: nurse ID + password

- Staff sign in with a **7-digit nurse ID** and **password**.
- For most staff, the password is the same as the nurse ID.
- Accounts are created by `scripts/seed-staff.mjs`, not through the app UI.

### 7. Run locally

```bash
npm run dev
```

Open `http://localhost:5173`.

## Assignment workflow

1. **Admin** edits department slot capacities on **Departments**
2. **Admin** creates a round (status: `draft`)
3. **Admin** opens submissions (`open`) — participants submit/edit preferences (when enabled)
4. **Admin** closes submissions (`closed`)
5. **Admin** clicks **Run assignment** — Edge Function executes cascade + lotteries
6. Round becomes `completed`; staff see scoped stats on **Dashboard**; participants see **My Result**

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

Optional: install the [Supabase Vercel integration](https://vercel.com/marketplace/supabase) to auto-sync env vars.

`vercel.json` is included for SPA routing.

## Deploy to Netlify (alternative)

1. Connect the GitHub repo at [netlify.com](https://netlify.com)
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add the same `VITE_*` environment variables
5. Add a redirect rule: `/* /index.html 200` (or use `public/_redirects`)

## Why not GitHub Pages?

GitHub Pages only hosts static files. This app needs:

- Supabase environment variables at build time
- A server-side Edge Function for fair lottery execution
- Realtime WebSocket subscriptions

Use GitHub for the repo; host the app on Vercel or Netlify.

## Testing

```bash
npm test
npm run build
```

Assignment engine tests live in `src/lib/assignment-engine.test.ts` (imports the shared engine under `supabase/functions/_shared/`).

## Publish to GitHub

This repo is ready to push. Prerequisites: [Git](https://git-scm.com/) installed, a [GitHub](https://github.com) account.

### 1. Create the empty repository on GitHub

1. Open [github.com/new](https://github.com/new)
2. Repository name: `nurse-ward-allocator` (or your preferred name)
3. Visibility: **Public** or **Private**
4. Do **not** add a README, `.gitignore`, or license — this project already includes them
5. Click **Create repository**

### 2. Push from your machine

Replace `YOUR_USERNAME` with your GitHub username:

```bash
git remote add origin https://github.com/YOUR_USERNAME/nurse-ward-allocator.git
git push -u origin main
```

SSH (if you use SSH keys):

```bash
git remote add origin git@github.com:YOUR_USERNAME/nurse-ward-allocator.git
git push -u origin main
```

### 3. After the first push

- **CI:** GitHub Actions runs `npm test` and `npm run build` on every push to `main`
- **Deploy:** Connect the repo to [Vercel](https://vercel.com) and set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- **Secrets:** Never commit `.env` — only `.env.example` is tracked

### Optional: GitHub CLI

If you install [GitHub CLI](https://cli.github.com/), you can create and push in one step:

```bash
gh repo create nurse-ward-allocator --public --source=. --remote=origin --push
```

## Project structure

```
src/                  React frontend
supabase/
  migrations/         Database schema + RLS
  functions/
    run-assignment/   Assignment Edge Function
    _shared/          Pure assignment engine + tests
```

## Free tier notes

- Supabase free projects pause after 7 days of inactivity — log in to unpause, or set a weekly cron ping
- Vercel and Netlify free tiers are sufficient for typical hospital ward rounds

## License

MIT
