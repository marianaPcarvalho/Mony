## Goal
Add a Profile area accessible by clicking "Hi, Mariana 👋" in the sidebar. The profile holds the user's **default salary** (used to auto-prefill new months) and **notification settings**.

## Changes

### 1. Data model (`src/lib/types.ts` + `src/lib/store.tsx`)
Extend `AppData` with a new `profile` object:
```ts
profile?: {
  name: string;            // "Mariana"
  defaultSalary: number;   // current salary, editable anytime
  notifications: {
    budgetAlerts: boolean;       // warn when category over budget
    monthlySummary: boolean;     // monthly recap notification
    savingsReminders: boolean;   // remind to deposit into goals
  };
}
```
Add store actions: `updateProfile(partial)`, `getProfile()`.

**Auto-prefill new month salary**: update `getSalary(month)` (or `getMonthConfig`) so that if no `MonthlyConfig` exists for the requested month, it returns a config seeded with `profile.defaultSalary` instead of 0. The first time the user edits salary for that month via `setSalary`, it persists as today.

### 2. New `ProfilePage` component (`src/components/ProfilePage.tsx`)
A page rendered inline (no dialog) when the profile view is active. Sections:
- **Account** — editable name (defaults "Mariana").
- **Current salary** — numeric input in € with inline save (Enter to save), labelled "This will pre-fill new months automatically."
- **Notifications** — three Switch rows (Budget alerts, Monthly summary, Savings reminders) with short descriptions.

Styled with the existing glass-card aesthetic, no modals.

### 3. Sidebar greeting becomes a button (`src/components/AppSidebar.tsx`)
Wrap the "BudgetFlow / Hi, Mariana 👋" header content in a clickable button that switches to the profile view. Add subtle hover state and a small chevron/user icon to signal it's interactive. Use the profile name dynamically.

### 4. Routing (`src/pages/Index.tsx` + `AppSidebar.tsx`)
Extend `ViewKey` with `"profile"`. Render `<ProfilePage />` when `view === "profile"`. Profile is **not** added to the sidebar menu list — it's only reachable via the greeting click (matches the "no top-level menu clutter" preference).

### 5. Hide month selector on profile view
In the header, only show `<MonthSelector />` for `view === "home"` (already the case) — no change needed beyond the new view key.

## Out of scope
- Actually wiring notifications to fire (no notification system exists yet). We only persist the preferences; hookups can come later.
- Auth / multi-user — name stays local.

## Notes
- All persisted via existing localStorage store (matches local-first core rule).
- All inputs support Enter-to-save (matches accessibility core rule).
- Navigation stays dashboard/affordance-based, no new top-level menu item.