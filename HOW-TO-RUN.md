# How to run Peek (simple guide)

*Written 2026-07-08, updated the same day after the Phase 2 data swap —
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
- **Sign-in doesn't exist yet.** It arrives in Phase 3. Until then the app
  always pretends you are the user called "You".

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
| The familiar **demo dataset** (sample conversations) | `npx convex run dev/seedDemo:seed '{"wipe": true}'` |

Switch between the two freely — it's the same app, just different contents
in the storage room.

## The demo dataset is kept forever (decision 2026-07-08)

The sample data is preserved in two places and will never be deleted:

- `src/data/` — the sample conversations as code (also the visual
  reference the pixel-perfect rule checks against, and what tests and
  Storybook use).
- `convex/dev/seedDemo.ts` — the loader that fills any database
  deployment with that sample data.

**To set up a separate demo instance later** (a demo that runs alongside
the real app, never touching real customer data): create a second Convex
deployment (`npx convex dev` in a copy of the project, or a named
deployment from the Convex dashboard), run the *fill* command against it,
and point that copy of the app at it via its own `VITE_CONVEX_URL`. The
real app launches with an empty database; the demo instance carries the
sample data.

## LATER — what the next phases add

**Phase 3 (sign-in):** a login screen (email/password or Google). Each
person who signs in gets their own identity, and the app keeps their data
under their account — the "wiped data + sign in + keeps data for
logged-in users" setup you asked about.

**Phase 4 (multi-user):** other people sign up, appear in your People
list, and you communicate with live updates on both screens.

## Cheat sheet

| I want to… | Today | After Phase 3 |
|---|---|---|
| See the app with sample data | fill DB, then run both terminals | same (on the demo instance) |
| See a fresh empty workspace | empty DB, then run both terminals | same, plus sign-up creates your account |
| Sign in as a real user | *(doesn't exist)* | yes — built in this phase |
| Keep my changes after refresh | yes (as "You") | yes (as your own account) |
