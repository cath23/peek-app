# How to run Peek (simple guide)

*Written 2026-07-08, updated 2026-07-09 after Phase 3 sign-in landed —
if something here doesn't match what you see, ask Claude to update it.*

## The picture in plain words

- The app you see in the browser is the **storefront**.
- The **database** (a service called Convex, running in the cloud) is the
  **storage room** where everything lives permanently.
- **As of today the storefront reads from the storage room** — people,
  topics, messages, replies, resolutions, reactions, huddles, and your
  starred/screener/open-work lists all come from the database, and the
  things you do (send, reply, resolve, react, star, dismiss) are **really
  saved**. Refresh, restart, come back tomorrow: still there.
- **Sign-in exists now (Phase 3).** Sign up with name + email + password
  and you're in immediately — no verification email, nothing external.
  Sign out from the menu behind your avatar (top right). Everything you
  see and send belongs to the account you're signed in as.

## Running the app

1. Terminal 1: `npx convex dev` (the "phone line" to the database — leave
   it running)
2. Terminal 2: `npm run dev` (the app)
3. Open the address it prints (usually http://localhost:5173).

The app shows whatever is **in the database**:

| What you want | Command |
|---|---|
| Look inside the database (opens a website) | `npx convex dashboard` |
| A brand-new, **empty** workspace (what real customers see on day one) | `npx convex run dev/seedDemo:wipe` |
| The familiar **demo dataset** (sample conversations) | `npx convex run dev/seedDemo:seedWithLogin '{"wipe": true}'` |

Switch between the two freely — it's the same app, just different contents
in the storage room. The demo dataset comes with a ready-made login —
**demo@peek.dev / Peek-demo-1** — sign in as that to be "Cath", the person
the sample conversations belong to.

## The demo dataset is kept forever (decision 2026-07-08)

The sample data is preserved in two places and will never be deleted:

- `src/data/` — the sample conversations as code (also the visual
  reference the pixel-perfect rule checks against, and what tests and
  Storybook use).
- `convex/dev/seedDemo.ts` — the loader that fills any database
  deployment with that sample data.

## The two public instances (decision 2026-07-09)

| | **peek-demo** | **peek-develop** |
|---|---|---|
| What it is | The prototype: opens straight into the demo data, **no login** | The real app: sign up, sign in, communicate |
| Backend | **None** — the demo data is baked into the app itself; anything you do lasts until you refresh | Convex **production** deployment `patient-grouse-611` (already created and configured; starts empty) |
| Cost | Free (a static site) | Free (Convex free plan) |

### Publishing them on Vercel (one-time, ~5 minutes)

Both are Vercel projects on the same GitHub repo — the only difference is
one environment variable.

1. Go to https://vercel.com/new and import the `Peek` repo → name the
   project **peek-demo** → **do not add any environment variables** →
   Deploy. Done: `peek-demo.vercel.app` is the no-login prototype.
2. https://vercel.com/new again, same repo → name it **peek-develop** →
   add one environment variable:
   `VITE_CONVEX_URL` = `https://patient-grouse-611.convex.cloud`
   → Deploy. Done: `peek-develop.vercel.app` is the real app — sign up
   and you're the first user.

After that, every `git push` updates both automatically. Backend changes
(anything in `convex/`) additionally need `npx convex deploy` once per
change (ask Claude — it's part of finishing any backend work).

## LATER — what the next phases add

**Phase 4 (multi-user):** unread state goes live per person, the Screener
fills itself from incoming messages, and two browsers see each other's
messages instantly (already free with Convex).

**Phase 5 (hardening):** verification/password-reset emails (needs an
email service + domain), file uploads, error screens, pagination.

## Cheat sheet

| I want to… | How |
|---|---|
| See the app with sample data locally | fill DB, run both terminals, sign in as demo@peek.dev / Peek-demo-1 |
| See a fresh empty workspace locally | empty DB, run both terminals, sign up |
| Show someone the prototype | send them the peek-demo link (no login) |
| Use the real app | the peek-develop link — sign up once, sign in ever after |
| Keep my changes after refresh | yes — everything is saved under your account (demo instance: session-only) |
