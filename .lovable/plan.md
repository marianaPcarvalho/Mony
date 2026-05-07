# Monthly Email Recap + Cloud Sync

## Goal

The user enters their email in **Profile**, their data syncs to the cloud, and on the **1st of each month** they receive an email summarizing the previous month: category breakdown, top 5 expenses, and savings goals progress.

No login screen. Each browser is identified by a device token stored in `localStorage`.

---

## 1. Enable Lovable Cloud

Required for: database, edge functions, scheduler, email sending.

## 2. Email collection

Add a small "Email recap" section to the Profile page:
- Email input + "Subscribe" button
- Toggle to pause/resume monthly emails
- Clear note: "We'll only send one email per month, on the 1st"

A device token (UUID) is generated on first load and stored in `localStorage`. Email + token are upserted to a `recap_subscribers` table.

## 3. Cloud data sync

A new `cloud_snapshots` table stores the user's full app data as a single JSON blob keyed by device token. The client pushes a snapshot on every change (debounced 2 s) so the recap job always has fresh data.

Local storage stays the source of truth for the UI — the cloud copy is a read-only snapshot for the email job. No sync conflict logic needed.

## 4. Security model (no login)

Because there is no authentication, the device token must act as a secret:
- Token is generated client-side (`crypto.randomUUID()`) and never displayed.
- RLS policies require the token to match a row, enforced by passing it through a custom header that the edge function validates.
- `cloud_snapshots` and `recap_subscribers` are NOT publicly readable. All reads/writes go through a `sync-snapshot` edge function that authenticates by the token.
- The monthly job uses the service role to read all snapshots (server-only).

Trade-off: if someone steals the token (e.g. shared device), they can read the data. This is acceptable for a personal budget app with no login, and the user explicitly chose this model.

## 5. Email infrastructure

Use Lovable's built-in transactional email (no third-party service):
- Set up email domain via the email setup dialog
- Scaffold the transactional email infrastructure
- Create a `monthly-recap` React Email template

Template content:
- Header with month name (e.g. "Your April recap")
- Totals: income, total spent, saved this month
- **Category breakdown** with progress bars (spent / budget)
- **Top 5 expenses** as a table
- **Savings goals** with current / target and on-track status
- Footer with link back to the app

## 6. Monthly scheduler

A pg_cron job runs at **08:00 UTC on day 1 of every month**:
1. Reads all active subscribers from `recap_subscribers`
2. For each, loads the latest snapshot from `cloud_snapshots`
3. Computes last month's totals/categories/top-expenses/savings status
4. Invokes `send-transactional-email` with the `monthly-recap` template

Idempotency key: `recap-{deviceToken}-{YYYY-MM}` — guarantees no duplicate sends if the cron retries.

## 7. Manual "Send me a preview" button

In Profile, next to the email field, add a "Send preview now" button so the user can test without waiting until next month. Invokes the same template with the *current* month's data.

---

## Technical details

**New tables**
```
recap_subscribers (id uuid pk, device_token uuid unique, email text, enabled bool, created_at, updated_at)
cloud_snapshots   (device_token uuid pk fk, data jsonb, updated_at)
```
RLS: deny all by default. Edge functions use service role.

**New edge functions**
- `sync-snapshot` — POST `{ deviceToken, email?, data }` → upsert subscriber + snapshot
- `send-recap-preview` — POST `{ deviceToken }` → render & send recap immediately
- Monthly cron job (SQL scheduled function) → calls `send-transactional-email` per subscriber

**New template**
- `supabase/functions/_shared/transactional-email-templates/monthly-recap.tsx`
- Props: `monthName`, `totals`, `categories[]`, `topExpenses[]`, `savingsGoals[]`

**Client changes**
- `src/lib/deviceToken.ts` — generate/persist token
- `src/lib/cloudSync.ts` — debounced snapshot push hook used in `StoreProvider`
- `ProfilePage.tsx` — email field, enable toggle, preview button

---

## What this build will need from you

1. Approve this plan.
2. After Cloud is enabled, you'll be prompted to set up an **email domain** (one-click dialog — you choose a subdomain like `notify.yourdomain.com`). This is required for sending real emails. DNS verification can finish in the background.

Once approved I'll execute steps 1–7 in sequence and let you know when it's ready to test.