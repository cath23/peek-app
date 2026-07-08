# The prototype — reference implementation

The pixel-perfect interactive prototype this app was born from is preserved,
frozen and runnable, at:

- **Repo:** https://github.com/cath23/Peek — tag **`prototype-v1`** (commit `d9b8aea`)
- **Local:** `k:\PeekApp`

When implementing or verifying behavior here, the prototype is the visual and
interaction reference. Run it side-by-side (`npm run dev` in `k:\PeekApp`).

## What the prototype has that this app doesn't

AI features were deliberately not carried over (see `MIGRATION.md`). To study
them, use the prototype at `prototype-v1`:

| Feature | Prototype files |
|---|---|
| Composer assist toolbar | `src/components/ComposerAssist.tsx`, `src/data/intelligenceData.ts` |
| Catch-me-up | `src/lib/intelligenceBridge.ts`, `src/components/ThreadPanel.tsx` |
| Topic Timeline | `src/components/TimelineView.tsx`, `src/data/timelineData.ts` |
| Agents (Linear/Figma/GitHub DMs) | `src/data/agentData.ts`, `src/components/NewAgentDmDialog.tsx`, `src/pages/PeoplePage.tsx` |
| Intelligence launcher rows / Ask-Peek | `src/components/CommandLauncher.tsx` |
| @App query rows | `src/components/ui/MentionMenu.tsx` |

## Everything else

File paths are otherwise identical between the two repos (this repo is a
verbatim copy at its root commit), so any prototype reference maps 1:1 here.
Feature documentation lives in `PRDs/Peek-Product-Overview.md`; the manual QA
playbook is `QA-PLAN.md`.
