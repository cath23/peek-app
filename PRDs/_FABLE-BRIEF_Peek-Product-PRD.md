# Task Brief for Fable 5 — "What Peek Is & How It Works" PRD

> **How to use this file:** This is a self-contained brief. Either paste it to Fable, or just say
> *"Read `PRDs/_FABLE-BRIEF_Peek-Product-PRD.md` and execute it end to end."*
> It contains the goal, all decisions already made, the exact sources to read (Linear + code),
> a phase-by-phase plan, and the required structure of the final document.

---

## 1. The goal (in one paragraph)

Produce a single, **non-technical, PRD-style document** that lets anyone on the team — including
people who never touch the code — understand **(A) what Peek is and how it works today, in detail**,
and **(B) concrete UX ideas for solving specific user tasks**. The two halves are weighted **50/50**.
The document should read like a product document a PM would circulate, not an engineering write-up.
No code, no file paths, no jargon in the final output.

**Audience of the final doc:** non-technical teammates (founders, design, marketing, ops, new hires).
**Author persona to adopt:** a senior product manager who has both read all the specs *and* used the
actual product, and can tell the difference between "the vision" and "what's actually built."

---

## 2. Decisions already made (do not re-ask these)

- **Scope of Linear:** pull from **everything accessible** in the workspace. Still flag which items
  are core product vs. adjacent/business (e.g. Nostr-for-Business protocol, Grants, "Find CTO",
  Marketing, Funding are **not** the product UX — treat as background/company context only).
- **Document focus:** **both halves, equally weighted** — (A) what Peek is + how it works, and
  (B) forward-looking UX ideas for specific tasks.
- **Tone:** non-technical, plain language. Explain concepts the way you'd explain them to a smart
  new teammate on day one.
- **Linear MCP:** already connected and authenticated, scoped to the PeekApp project (local config).
  The tools are available in this session (`mcp__linear__*`).

---

## 3. The crucial framing that makes this document valuable

There are **two versions of Peek** and the doc must hold both in view without confusing them:

1. **The vision** — what the Linear initiatives, PRDs, and the "Mission" doc *describe*. Much of this
   is Shaping/Framing/Designed status — i.e. planned, not necessarily built.
2. **The built prototype** — what actually exists and runs in the codebase at `k:\PeekApp`
   (a React + Vite + Tailwind front-end prototype with mock data).

**Rule:** whenever you describe a feature, make clear whether it is **Built today**, **Designed / in progress**,
or **Vision / planned**. This distinction is the single most useful thing the doc can give the team.
A simple label or column is enough (e.g. `✅ Built`, `🟡 Designed`, `🔭 Vision`).

---

## 4. Sources to read — LINEAR (the vision & specs)

One team: **Peek** (`PEEK`). Work through initiatives in this priority order. For each, read the
initiative description, then its projects (use `get_project` for full descriptions — the list view
truncates), then the linked documents.

### Tier 1 — Core product (read fully, these drive the doc)
- **Initiative: Topics & Conversations** — *the core of Peek.* Read its full description (it defines the
  3-level hierarchy: Message/Conversation → Topic → Theme, and the ownership rules).
  - Projects: **Topics**, **Conversations**, **Huddles**, **Following topics**, **Topic Timeline**,
    **Timeline entries**, **AI conversation**.
  - Key docs: **"Product spec: Conversations, Topics, Categories, Tags, and Highlights"** (information
    architecture), **"Huddles and Topics"**, **"Huddles PRD"**.
- **Initiative: Desk** — *the user's home for organizing their work.*
  - Projects: **Open working items** (Designed), **Screener** (Designed), **Urgent** (Designed),
    **Starred** (Designed), **Catch up** (Shaping).
  - Key docs: **"PRD — Catch-up"**, **"Spec — Topic-level Catch-up cadence"**.
- **Initiative: Writing experiences** — *writing is the heart of Peek.*
  - Project: **Shortcuts** (contextual actions from the writing field: @mention, !urgent, highlight,
    resolve, topic/file refs, etc.).
- **Initiative: People & Teams** — Project: **Mentions** (how addressing people/teams works).
- **Initiative: Files** — how files are organized around conversations (no projects yet; read the summary).

### Tier 2 — AI layer (read, but mark clearly as vision unless found in code)
- **Initiative: AI** ("human-first, AI-last"). Projects: **Intelligence** (cmd/ctrl+K contextual help),
  **AI (re)search conversation**, **Agents / workflows**. Key doc: **"Intelligence PRD draft"**.

### Tier 3 — Company/vision context (skim; use only for the "What Peek is / why it exists" intro)
- Doc: **"Mission"** (the philosophy — "communication is thinking"). Great for the opening section.
- Initiative: **Nostr for Business** + its RFCs, **Peek HQ** (Grants, Find CTO, Funding, Marketing).
  These are **infrastructure/business**, not product UX. Mention only briefly as "what powers it / where
  it's going," do not let them dominate the doc.
- Initiative: **[Archived] Views / Tags** (Completed) — read only to understand what was tried and dropped.

> Also scan **issues** per Tier-1 project (`list_issues` with the project filter) to see concrete,
> in-progress task definitions — these are gold for the "specific task UX" half.

---

## 5. Sources to read — CODEBASE (the built reality) at `k:\PeekApp`

Stack: **React + Vite + TypeScript + Tailwind**, prototype with mock data. Type-check with `tsc -b`
(not `tsc --noEmit`).

**Start with the memory files — they are a pre-built map of the whole app:**
- `C:\Users\Cath\.claude\projects\k--PeekApp\memory\MEMORY.md` (index) and the session files it links,
  especially: People page, Topics page, Writing experience, Files/Resolution/Theme/Sidebar, Threads,
  **Desk + Screener + Debug**, DM-to-Topic flow, Topic resolution, Inline resolution editing.
- Repo docs: anything in `PRDs/`, `QA-PLAN.md`, `MONOREPO-PLAN.md`, `COMPONENT-BACKLOG.md`.

**Then walk the actual UI systematically.** For each screen/surface, capture: purpose, what's on it,
what the user can do, and how it connects to other surfaces. Known built surfaces to confirm and detail:
- **App shell / sidebar** (expanded + collapsed), theme switcher.
- **Desk** page — Open working items, **Screener** section, **Starred**, Catch-up, debug/variant menu.
- **People** page.
- **Topics** page — left list + right detail panel, topic detail tabs, resolution, Timeline, Huddles tab.
- **Conversations / Conversation cards**, **Thread panel** (conversation + huddle threads),
  **Pinned message**, **Highlights**.
- **The writing experience** — Tiptap editor: `@mentions`, `!urgent`, `[topics`, `[files`, `->` resolution,
  lists, Enter/Shift+Enter behavior, sent-message rendering, InlineTags.
- **Huddles** — HuddleCard, HuddleGrid, new-huddle flow, huddle menus.
- **DM → Topic promotion flow** (start-topic dialog, huddle anchor, toast/empty-state).

**Best way to see it:** run the app (`/run` skill, or `pnpm dev` / `npm run dev`) and click through,
rather than only reading source. Screenshot key screens for the doc if useful.

> **Reconcile constantly:** for every Linear concept, check "is this actually in the running app?"
> That comparison is what produces the `✅ Built / 🟡 Designed / 🔭 Vision` labels.

---

## 6. The plan — phases to follow throughout

Track this with a todo list and work top to bottom.

**Phase 0 — Orient (short).**
Read the memory index + this brief. Confirm Linear is connected (`mcp__linear__list_teams`).
Confirm the app runs.

**Phase 1 — Linear deep read.**
Read Tier-1 initiatives/projects/docs in full (use `get_project` / `get_document` — never rely on the
truncated list output). Skim Tier-2 and Tier-3. Take structured notes per feature: *what problem it
solves, how it's meant to work, current status.* Capture verbatim the key mental-model rules (e.g. the
Message→Topic→Theme hierarchy and its ownership rules; "urgent" vs "mention" philosophy).

**Phase 2 — Codebase & UX walkthrough.**
Run the app. Walk every built surface (Section 5). For each: purpose, contents, user actions, and the
flows in/out. Note anything built that isn't in Linear, and anything in Linear that isn't built.

**Phase 3 — Map user journeys.**
Reconstruct the end-to-end journeys the product is designed around, e.g.:
- Start my day → triage the **Screener** → pull items into **Open work**.
- Get pinged / something **Urgent** → respond → **resolve**.
- Follow a **Topic** → **Catch up** on what changed → open its **Timeline**.
- Have a rough idea → open a **Huddle** (with a person or AI) → promote to a **Topic**.
- Write a message → use **Shortcuts** (@ ! [ ->) → send.
- Turn a **DM into a Topic**.
For each journey: the trigger, the steps, where it's smooth, where it breaks or is unbuilt.

**Phase 4 — Write the document** (structure in Section 7).

**Phase 5 — Review & polish.**
Re-read as a non-technical person. Strip jargon. Verify every `✅ Built` claim against the running app.
Make sure the two halves are genuinely balanced 50/50. Add a one-line glossary for any Peek-specific term.

---

## 7. Required structure of the final document

Write in Markdown. Keep language plain. Use tables, short sections, and (optionally) screenshots.
Every feature description gets a status label (`✅ Built / 🟡 Designed / 🔭 Vision`).

**Part 0 — TL;DR** (½ page): What Peek is in 3–4 sentences, who it's for, and the one big idea
("communication is thinking" / high-signal, focus-first alternative to Slack).

**Part A — What Peek is & how it works** *(≈50%)*
1. **Why Peek exists** — the problem with Slack-style tools; Peek's philosophy (from the Mission doc).
2. **The mental model** — the core concepts and how they relate: **Conversations, Topics, Themes,
   Huddles, Highlights, Timeline, Files, Urgent, Mentions.** Include a simple diagram of the hierarchy
   and the key rules (e.g. a conversation belongs to at most one Topic).
3. **The main surfaces / where you spend time** — **Desk** (Open work, Screener, Starred, Catch-up),
   **Topics**, **People**, **Conversations & Threads**, the **Writing experience & Shortcuts**. For each:
   what it's for, what you see, what you can do. Status-labeled.
4. **Core user journeys** — the walkthroughs from Phase 3, told as short narratives.
5. **The AI layer** — Intelligence (cmd/K), AI conversations, agents — clearly marked as mostly vision.
6. **What's built today vs. planned** — a single summary table of every feature with its status.

**Part B — UX ideas for specific tasks** *(≈50%)*
Organize around **jobs-to-be-done / specific tasks**, not features. Strong candidates (pick the most
important, go deep, don't pad): *triaging incoming messages (Screener), staying on top of many Topics
without FOMO (Catch-up + Following), signalling true urgency without Slack-style noise (Urgent),
understanding a long conversation fast (Timeline/Highlights), thinking privately before going public
(Huddles), fast in-flow writing actions (Shortcuts), promoting a DM into shared knowledge.*
For **each task**:
- **The user's goal** (in their words).
- **How it works today** (or "not yet built").
- **Where the friction is.**
- **1–3 concrete UX ideas** to solve it — described as experiences (what the user sees/does), with
  trade-offs. Keep it non-technical; a rough sketch or step list is ideal.

**Part C — Appendices**
- **Glossary** of Peek terms.
- **Source index** — which Linear docs/initiatives and which app screens informed the doc (so people
  can dig deeper). Link Linear URLs.
- **Open questions** surfaced during research.

---

## 8. Working guidelines

- **Distinguish built vs. planned on every claim.** Never present a vision feature as if it ships today.
- **Show, don't just tell** — screenshots of real screens beat prose for the non-technical audience.
- **Use `get_project` / `get_document` for full text.** The `list_*` outputs are truncated and will
  mislead you.
- **Reuse existing knowledge** — the memory session files already describe most built surfaces; verify
  against the running app rather than re-deriving from scratch.
- **Stay non-technical in the output.** No component names, file paths, or framework talk in the doc body
  (those can live only in the source index if at all).
- **Balance the halves.** If Part B is getting thin, go deeper on real task UX rather than padding Part A.

---

## 9. Output & done criteria

- **Save the final document to:** `k:\PeekApp\PRDs\Peek-Product-Overview.md`.
- **Optional (nice for sharing):** also publish a polished, self-contained **Artifact** (web page) version
  for non-technical teammates — same content, nicely formatted, light/dark aware.
- **Definition of done:**
  1. Both halves present and roughly equal.
  2. Every feature carries a Built / Designed / Vision label.
  3. All Tier-1 Linear docs read (not just skimmed from list view) and reflected.
  4. Every "Built" claim verified against the running app.
  5. A non-technical reader could, after reading, explain what Peek is and how a day in it goes.
  6. Glossary + source index included.

---

## 10. Quick reference — Linear map (as of this brief)

**Initiatives → Projects**
- **Topics & Conversations** (core): Topics · Conversations · Huddles · Following topics · Topic Timeline · Timeline entries · AI conversation
- **Desk**: Open working items · Screener · Urgent · Starred · Catch up
- **Writing experiences**: Shortcuts
- **People & Teams**: Mentions
- **Files**: (no projects yet)
- **AI**: Intelligence · AI (re)search conversation · Agents / workflows
- **Nostr for Business** (infra/business — background only): Cross-app communication/components · Agents/workflows · Pitch scenarios · Design guideline site
- **Peek HQ** (company — background only): Grants · Find "CTO"
- **[Archived] Views / Tags** (dropped — context only)

**Key documents:** Mission · Product spec: Conversations/Topics/Categories/Tags/Highlights ·
Huddles and Topics · Huddles PRD · PRD — Catch-up · Spec — Topic-level Catch-up cadence ·
Intelligence PRD draft · (RFCs + Marketing + Funding = background only)
