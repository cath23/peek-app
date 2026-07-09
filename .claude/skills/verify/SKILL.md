---
name: verify
description: Build, launch, and drive the Peek app to verify a change end-to-end (Vite + live Convex dev deployment + headless system Chrome via playwright-core).
---

# Verifying Peek changes at the running app

## Launch

- `npm run dev` (background) → http://localhost:5173. `.env.local` already
  points at the live Convex dev deployment (`hallowed-stork-966`), so the
  app runs in **Convex mode** with the seeded demo dataset.
- Unit tests / Storybook run in **mock mode** (no `VITE_CONVEX_URL` in
  test env) — they never exercise the Convex read/write paths. Anything
  touching `hasConvex === true` branches must be verified in the running app.

## Drive (headless browser)

- `playwright-core` is a devDependency (no browser download); launch with
  the system Chrome:
  `chromium.launch({ executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', headless: true })`
- Put the driver script **inside the repo** (e.g. `.verify-drive.mjs`,
  delete after) — Node resolves `playwright-core` from the script's dir,
  not cwd.
- URL routing: `/desk`, `/topics`, `/topics/:id`, `/people`, `/people/:id`.
- Clicking a message card opens the thread panel (the card body is the
  click target). Seeded bodies in `src/data/topicData.ts` make good
  `getByText` anchors (e.g. t1_c1 "Hey everyone, our CI/CD pipeline…").

## Server-side state divergence trick

To prove remote-vs-mock precedence, mutate the deployment directly so the
mock and the server disagree, then check which one renders:

```
npx convex run messages:editBody '{"key":"t1_c1","body":"MARKER …"}'
```

Always revert afterwards (original bodies are in `src/data/*`), or reseed:
`npx convex run dev/seedDemo:seed '{"wipe": true}'` (dev-only; also resets
any test topics/messages created while driving).

## Auth flows (Phase 3)

- Unauthenticated → the AuthScreen card ("Welcome back"). Drive sign-up /
  verify / reset by placeholder text (see `.verify-auth.mjs` pattern from
  the Phase 3 session if present).
- OTP codes: with no `RESEND_API_KEY` env var the code is LOGGED, not
  emailed — fetch the newest with
  `npx convex logs --history 50 | grep "code for"` (the command streams;
  spawn + kill after ~8s, or run it under `timeout` in bash).
- A sign-in attempt on an unverified account re-sends a NEW code — always
  take the newest log line.
- Test accounts pollute the People list; reseed
  (`dev/seedDemo:seed {"wipe": true}`) wipes auth tables too.

## Gotchas

- The seeded dataset may have accumulated extra records from earlier
  manual testing (e.g. stray topics) — reseed if a clean baseline matters.
- Screenshots: 1600×950 viewport matches the design reference well.
