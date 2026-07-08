# Intelligence in the Prototype - Feature Spec + Exact Mock Data

*Everything below is deterministic: no real AI calls. Every "AI output" is precomputed mock data chosen so the flows demo believably on the existing example content. The design rule throughout: an action appears only where it can succeed; the context that enables it advertises it.*

**The anchor storyline.** Almost every scenario runs on **Topic 3 "Ongoing onboarding issues"** (Jake/Greg/Alice, the liveness-check investigation, SDK 3.4.2, guidance screens Option A/B) because it already connects to the Figma mock file (*Onboarding v2* frames), the Zendesk ticket grammar, and Alice's DM. One coherent story across all features.

---

## F1. Composer selection toolbar - Fix / Tighten / Check facts

**Where:** floating toolbar above a text selection *inside a compose box* (main, reply, huddle). Moves OFF sent messages (read-side selection becomes silent ⌘K context, see F2). Buttons: **Fix** (IconAbc) / **Tighten** (IconWand) / **Check facts** (IconListCheck or similar) / divider / **⌘K** (IconCommand).

**Interaction:** click -> preview appears as an inline panel anchored to the composer showing old vs new (diff treatment: removed = red strikethrough, added = green). `Apply` replaces the selected span in place; `Esc` dismisses. With no selection, Fix/Tighten operate on the whole draft.

### F1a. Fix (spelling & grammar) - genuinely rule-based, works on any text

`TYPO_FIXES` dictionary in `src/data/intelligenceData.ts`:

| typed | fixed |
|---|---|
| `teh` | `the` |
| `recieve` | `receive` |
| `seperate` | `separate` |
| `definately` | `definitely` |
| `occured` | `occurred` |
| `adress` | `address` |
| `alot` | `a lot` |
| `im` (word-boundary) | `I'm` |
| ` i ` (standalone) | ` I ` |

Plus rules: capitalize sentence starts, collapse double spaces. If nothing changes: honest state **"Nothing to fix."** (no panel spam - a small transient label on the toolbar).

### F1b. Tighten - filler-strip rules + one scripted showcase

Rule pass (works on any text): drop `definitely`, `basically`, `actually`, `really`, `just`, `very`, `I think that` -> `I think`, `in order to` -> `to`, `at this point in time` -> `now`, `the thing is that` -> (removed).

Scripted showcase pair (exact match wins over rules) - the draft from Katerina's Figma mock:

- **Input:** `I was testing the new build with the upgraded SDK and it's definitely better than what we had before. But I realized that the screen with the guidelines how to do the face scan might be a bit abstract for people since it's only text.`
- **Output:** `The new SDK build is a clear improvement. But the face-scan guidance screen may be too abstract for people - it's text-only.`

If rules change nothing: **"Already tight."**

### F1c. Check facts - grounded against the open conversation

`FACT_CHECKS` table; each entry = {trigger regex on the selected/draft text, required context (topic id or dm id), flag sentence, anchor conversation id}. The flag renders with a link that opens the anchor thread.

| you claim (trigger) | context | Intelligence flags | anchor |
|---|---|---|---|
| `/iphone/i` | topic 3 | "Greg's funnel data (Today, 10:22 AM) attributes degraded performance to older **Android** devices, not iPhones." | `t3_c2` |
| `/option b/i` or `/animation/i` | topic 3 | "The team converged on **Option A** in Alice's design thread (Today, 2:20 PM)." | `t3_c4` |
| `/429/` or `/rate limit/i` | topic 3 | "Greg's analysis points to the **liveness check UX**, not rate limiting (Today, 10:22 AM)." | `t3_c2` |
| `/3\.4\.1/` | topic 3 | "The comparison Greg ran was against SDK **3.4.2** (Today, 11:15 AM)." | `t3_c3` |
| no match | any | honest state: **"No conflicts found with this conversation."** | - |

**Demo script:** in topic 3's composer type `Most failures seem to happen on older iPhones during the 429 storm` -> select -> Check facts -> two flags with links.

---

## F2. Read-side selection - silent context + Explain

No toolbar on sent-message selections (people select while reading; popups there are clutter). A selection inside `[data-message-body]` remains a **silent ⌘K context** (already built). With a selection, the launcher shows:

- **Explain this** - `EXPLANATIONS` dictionary, keyed by term (case-insensitive substring match on the selection):

| selected term | explanation shown (with subtitle "Scoped to this conversation") |
|---|---|
| `liveness check` | "A verification step where the user proves they're a live person - not a photo - by moving or blinking on camera. In our signup flow it runs during identity verification, and it's where 41% of users currently drop off." |
| `exponential backoff` | "A retry strategy where each failed attempt waits longer before retrying (1s, 2s, 4s...) so a struggling service isn't hammered while it recovers." |
| `SDK 3.4.2` | "The vendor kit embedded for the face scan step. 3.4.2 adds low-light detection and real-time positioning feedback over our current 3.1.0." |
| `drop-off rate` | "The share of users who start the flow but leave before completing it." |
| `job queue` | "Work is processed in the background instead of while the user waits; a notification fires when the result is ready." |
| anything else | honest state: **"Can't explain that one confidently, so I won't guess."** |

- **Quote in reply** (not AI): inserts the selection as a quoted line into the thread reply composer. Cheap, human, probably the most used row.

**Demo:** select "liveness check" in Greg's `t3_c2` message -> ⌘K -> Explain this.

---

## F3. Timeline (topic) + Catch me up (thread) - one entry model, two scopes

### Data model (new `src/data/timelineData.ts`)

```
TimelineEntry {
  id, topicId,
  kind: 'topic-created' | 'new-conversation' | 'new-replies' | 'resolution' | 'highlight',
  dateLabel, time,
  sentence,          // the ONLY AI-written part (resolutions reuse the human message verbatim)
  actors: string[],  // rendered bold, per Katerina's Figma design
  anchorConvId,      // click -> opens that thread
}
```

Rendering = Katerina's Figma design: date dividers, dot rail, typed pill (Topic created = purple, Resolution = green, others = neutral), sentence with bold actor names, time right-aligned.

### Exact entries for Topic 3

| # | date | kind | time | sentence | anchor |
|---|---|---|---|---|---|
| 1 | Mon, August 18 | Topic created | 9:08 AM | "**Jake Walter** created a public topic Ongoing onboarding issues" *(structural, no AI)* | t3_c1 |
| 2 | Mon, August 18 | New replies | 9:45 AM | "**Jake Walter** traced the added friction to compliance steps shipped under deadline pressure; a full flow review is planned" | t3_c1 |
| 3 | Today | New conversation | 10:22 AM | "**Greg Bothman**'s funnel data pinned the drop-off on the liveness check: 41% of users who reach it never complete it" | t3_c2 |
| 4 | Today | Resolution | 11:00 AM | "Root cause confirmed: liveness check UX. SDK upgrade and UX rework underway." *(human resolution message, verbatim)* | t3_c2 |
| 5 | Today | New conversation | 11:15 AM | "**Greg Bothman** proposed shipping the SDK 3.4.2 upgrade as a quick win before the full UX rewrite; **Zack Bright** to own the sprint" | t3_c3 |
| 6 | Today | New replies | 2:20 PM | "**Alice Johnson** compared two guidance-screen directions in Figma; the team chose Option A (static illustrations) over animation" | t3_c4 |
| 7 | Today | New conversation | 3:00 PM | "**Jake Walter** flagged that the error screen restarts the whole flow; a 'Try again' shortcut is going into the spec" | t3_c5 |
| 8 | Today | Resolution | 4:10 PM | "Spec updated: SDK 3.4.2 + illustration option A + retry shortcut. Going to QA next sprint." *(verbatim)* | t3_c6 |

Lives in the **Timeline tab** (huddle variant 1 already scaffolds it - this replaces the placeholder). Entry click opens the anchored thread.

### Catch me up (thread scope)

To make the demo honest, `t3_c4` (guidance screen thread) grows from 4 -> **12 replies**; replies 5-12 are marked unread (`isNew`). Exact new replies for `replyData.ts`:

| id | author | time | body |
|---|---|---|---|
| r_t3c4_5 | Daniel Stanton | 2:50 PM | "Late to this - did we consider a hybrid? Static frames that advance on tap. Keeps it lightweight but still shows motion." |
| r_t3c4_6 | Alice Johnson | 2:58 PM | "Considered it, but tap-to-advance adds an interaction step exactly where users are already failing. I want zero extra input on this screen." |
| r_t3c4_7 | Greg Bothman | 3:05 PM | "Data point: 68% of the drop-off sessions are on devices older than 3 years. Whatever we pick has to render instantly." |
| r_t3c4_8 | Daniel Stanton | 3:12 PM | "Fair. A static sequence wins on render cost, no contest." |
| r_t3c4_9 | Alice Johnson | 3:30 PM | "Assets for Option A are done. Exported all three steps to the Onboarding v2 file, Guidance page." |
| r_t3c4_10 | Jake Walter | 3:40 PM | "Reviewed. Step 2's caption still reads too technical: 'Align facial features within the boundary'. Can we humanize?" |
| r_t3c4_11 | Alice Johnson | 3:48 PM | "Changed to 'Center your face in the frame'. Also bumped the outline contrast per the accessibility check." |
| r_t3c4_12 | Greg Bothman | 3:55 PM | "Perfect. This is ready to fold into the spec." |

The thread panel header for t3_c4 shows **"8 new · Catch me up"**. Clicking folds three checkpoint dividers (same TimelineEntry component, compact) into the reply stream at their chronological positions - scarcity: 3, not 8:

1. before r_t3c4_5: "Compared static illustrations vs looping animation; **Option A** chosen for simplicity and accessibility"
2. before r_t3c4_9: "A tap-to-advance hybrid was considered and rejected - old-device performance data favors static"
3. before r_t3c4_12: "Final assets shipped to Onboarding v2 › Guidance; step 2 copy humanized after review"

Plus a "since you left" divider before r_t3c4_5. Checkpoints are dismissible (X removes them all; on-demand, never persistent). The ⌘K launcher's old "Summarize this conversation" row is **renamed "Catch me up"** and requires an open thread with unreads.

---

## F4. @App inline query - the reference implementation

**Entry:** the `@` mention menu gains an **Apps** section at the bottom (human-first ordering), shown only when the query prefix-matches an app name with 2+ chars (`fi` -> Figma; `alice` never surfaces apps). Apps: Figma, Zendesk, Linear, GitHub (Linear/GitHub rows present but inert v1 - selecting closes; they'll say "not wired in this prototype" in the empty state). No Topics in the @ menu: `@` = actors, `[` = things.

**Selecting an app:** the `@fig` token range is recorded, the **command launcher opens pre-scoped** to that app (same component as ⌘K - one surface, two doors) with placeholder **"Ask Figma anything..."**, the composer as attach target, and the token as insertion point. Below the empty input: up to 2 **recents** (mock, per app):

- Figma: `onboarding error screens`
- Zendesk: `When was the last time a bug related to onboarding was reported?`

**Insertion rule:**
- pick **one** result -> token replaced inline by the reference chip (the sentence completes: "See the current screen [Guidance screen - Option A]")
- pick **several** -> token evaporates, frames land in the attachment strip
- **Esc** -> token and all traces removed from the draft

### F4a. Figma flow (artifacts)

Demo query from the mock: **"face scan guidelines"**. To make it hit, `figmaData.ts` keywords are extended:

- `fg-frame-3` (Guidance screen - Option A) += `face`, `scan`, `face scan`, `guidelines`, `liveness`, `steps`
- `fg-frame-4` (Guidance screen - Option B) += `face`, `scan`, `face scan`, `guidelines`, `liveness`
- `fg-frame-1` (Error state - returning user) += `face scan`, `liveness`

So "face scan guidelines" returns frames 3 + 4; "face scan" returns 1, 3, 4 (mirrors the 3-result grid in Katerina's mock). Grid/preview/multi-select = existing FigmaFindPanel.

### F4b. Zendesk flow (answers) - new mock data

`ZENDESK_TICKETS` in `intelligenceData.ts`:

| id | subject | status | tickets last 30d |
|---|---|---|---|
| 49102 | Stuck on the face scan step - keeps failing | open | 23 |
| 49076 | Camera permission loop on Android | open | 11 |
| 48990 | Verification email never arrives | open | 8 |
| 48821 | Repeated 429 errors during peak hours | solved | - |

Query routing (mock heuristic): a Zendesk query containing `onboarding` + (`common` or `issues` or `top`) returns the **answer block**:

> **Top 3 onboarding issues, last 30 days**
> 1. Face scan fails or loops - 23 tickets - ticket #49102
> 2. Camera permission denied on Android - 11 tickets - ticket #49076
> 3. Verification email delays - 8 tickets - ticket #48990

Rendered in the launcher body with a Zendesk icon header (app icon, never a sparkle) and one **Insert** button -> places the text at the token position. The `ticket #49102` strings auto-become ReferenceChips via the existing INLINE_TOKEN_RE parsing, so grounding comes free.

The recent-query `When was the last time a bug related to onboarding was reported?` answers: **"Yesterday, 4:52 PM - ticket #49102 (face scan loop on a Pixel 4a)."**

Any other Zendesk query with a `#\d+` token -> that ticket as an attachable row; anything else -> honest empty state: **"Nothing in Zendesk matches that."** + one row **"Ask the Zendesk agent"** (opens the agent DM with the query pre-filled in the composer).

**Demo script (Katerina's mock, end to end):** in topic 3 type `@alice I was testing the new build... See the current screen @fig` -> Apps > Figma -> "face scan guidelines" -> searching state -> 2 results -> pick Option A -> chip completes the sentence -> send.

---

## F5. ⌘K launcher - vocabulary update + chips-in-view context

Intelligence rows become: **Fix spelling & grammar** / **Tighten writing** (draft-or-selection), **Check facts** (draft, conversation open), **Explain this** (read-side selection), **Catch me up** (open thread with unreads). Same capability filtering as built; wording matches the toolbar so the two surfaces teach each other.

**Chips-in-view context (new):** reference chips visible in the open conversation enable app actions naming their object. Mock: DM with Alice contains `ticket #48821` chips -> ⌘K (or Zendesk scope) shows **"Draft a reply on ticket #48821"** -> canned draft in the answer block with **Copy** (no fake send):

> "Hi - quick update: the rate limiting issue is fixed in production as of build #5102. Retries now back off exponentially, so the 429 loops are gone. Could you confirm it looks good on your side so we can close this out?"

Same rule powers `build #5102` -> GitHub "Check status of build #5102" (inert row v1, present to demo the pattern).

**Search Peek row goes live (minimal):** substring search over topic titles, conversation bodies, and resolution messages. Result rows: `#Ongoing onboarding issues · Greg Bothman: "...41% of users who reach it don't complete it..."` -> Enter navigates to the topic and opens that thread. Demo queries: `liveness` (3 hits in topic 3), `remote work` (topic 4), `export button` (topic 5).

## F6. `[` dead-end handoff

When the `[` reference menu has zero name matches, its last row becomes **`Find with ⌘K: "<query>"`** -> opens the launcher with the query carried over (and the token consumed on insert, same rule as F4). `[` itself stays a pure name-picker.

---

## Build order

1. **F3** Timeline + Catch me up (new data files, TimelineEntry component, Timeline tab content, thread checkpoints) - the flagship, and it feeds the Timeline tab that's been a placeholder for weeks
2. **F4** @App -> pre-scoped launcher (Apps section in @ menu, token insertion rules, Figma artifacts + Zendesk answer block, recents, honest empty states)
3. **F1** Composer selection toolbar (move off messages, Fix/Tighten/Check-facts with preview diffs)
4. **F5** Launcher vocabulary + chips-in-view presets + Search Peek
5. **F2** Explain + Quote in reply; **F6** `[` handoff

Out of scope for the prototype: real model calls, auto-generated timeline entries (all precomputed), Linear/GitHub @-flows beyond inert rows, agent auto-replies to handed-off queries.
