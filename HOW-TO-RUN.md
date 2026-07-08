# How to run Peek (simple guide)

*Written 2026-07-08. This guide gets updated as the backend work progresses —
if something here doesn't match what you see, ask Claude to update it.*

## The picture in plain words

- The app you see in the browser is the **storefront**.
- The **database** (a service called Convex, running in the cloud) is the
  **storage room** where real messages will live permanently.
- Right now the storefront still displays **fake sample data** that is written
  inside the code itself. The storage room is built, connected, and already
  contains a copy of the sample data — but the storefront doesn't take
  anything from it yet. Connecting them, screen by screen, is the current
  work (Phase 2 of PRODUCTION-PLAN.md).
- **Sign-in doesn't exist yet.** It arrives in Phase 3. Until then the app
  always pretends you are the user called "You".

## Running the app TODAY (fake data)

One command in the terminal, from the project folder:

```
npm run dev
```

Open the address it prints (usually http://localhost:5173). Everything you
see is the fake sample data. Nothing you do is saved — refresh and it resets.

## The database: three useful commands

These work today. They only touch the storage room — the app won't look
different yet.

| What you want | Command |
|---|---|
| Look inside the database (opens a website) | `npx convex dashboard` |
| Empty the database completely ("brand-new workspace") | `npx convex run dev/seedDemo:wipe` |
| Fill the database with the demo dataset again | `npx convex run dev/seedDemo:seed '{"wipe": true}'` |

One extra thing: for the database commands (and later for the real app) a
helper needs to be running in a second terminal:

```
npx convex dev
```

Leave it running — it's the "phone line" between your computer and the
database. You already did this once when you signed in with GitHub; you can
keep it running whenever you work on the app.

## LATER — the real app (this is the part that doesn't work yet)

**When Phase 2 is finished**, the formula becomes:

1. Terminal 1: `npx convex dev` (the phone line)
2. Terminal 2: `npm run dev` (the app)
3. The app now shows whatever is **in the database**:
   - After the *empty* command above → a brand-new, empty workspace
     (this is what real customers would see on day one).
   - After the *fill* command above → the familiar demo conversations.
4. Things you write are **really saved** — refresh, restart, come back
   tomorrow: still there.
5. There will also be an `npm run dev:mock` command to run the old
   fake-data version for comparison. *(Not created yet.)*

**When Phase 3 is finished**, the same two commands also give you:

6. A sign-in screen (email/password or Google). Each person who signs in
   gets their own identity, and the app keeps their data under their
   account — this is the "wiped data + sign in + keeps data for logged-in
   users" setup you asked about.

## Cheat sheet

| I want to… | Today | After Phase 2 | After Phase 3 |
|---|---|---|---|
| See the app with sample data | `npm run dev` | fill DB, then run both terminals | same |
| See a fresh empty workspace | *(not visible yet)* | empty DB, then run both terminals | same, plus sign-up creates your account |
| Sign in as a real user | *(doesn't exist)* | *(doesn't exist)* | yes — built in this phase |
