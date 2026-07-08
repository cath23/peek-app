# Huddles, Highlights/Timeline, and the DM-to-Topic flow — discussion notes

Notes captured from design discussion sessions in late April / early May 2026. Three questions covered: (1) how huddles surface their existence inside a topic, (2) what the MVP cut of Highlights/Timeline should actually contain, and (3) how a user starts a topic from a DM and how that DM signals its new context.

## 1. Huddle discoverability — options beyond the lock icon

Right now the only signal is a lock icon on the Huddles tab. The real choice is along a spectrum from "fully invisible" to "fully transparent metadata":

1. **Invisible** — users only see huddles they're in. Tab is empty otherwise. Pro: maximum privacy. Con: reproduces the shadow-channel problem private topics had — people don't know what they don't know.
2. **Count only** — `Huddles (3) 🔒`. Topic members see *that* huddles exist, not what or who. Low information leakage, kills shadow-channel feeling. Honest but a bit cryptic.
3. **Titles + members visible, content locked** — list shows "Pricing strategy huddle · Sarah, Mark, Jen". Anyone in the topic can see *who is talking about what*, just not the content. Like seeing a meeting on someone's calendar.
4. **Hybrid (recommended)** — your own huddles fully visible in the list; others appear as locked rows with title + members but greyed/locked content. Subtle "+2 more you're not in" if you want to soften it further.
5. **Fully transparent** — list shows everything, only the message bodies are locked. Strongest social transparency, can feel surveillance-y in some cultures.

Lean **3 or 4**. Reasoning: huddles' whole legitimacy depends on them feeling like *purposeful side-conversations within a shared topic*, not secret backchannels. Showing title + members preserves that legitimacy ("oh, the design folks are aligning on X") without exposing the content. Option 1 quietly recreates exactly the trust problem private topics were removed to solve.

### Orthogonal details worth deciding
- **Tab badge state**: dot for "huddles you're in have unread," no badge for "other huddles have activity." Don't notify about huddles you're not in.
- **Ephemerality cue**: if huddles tend to be short-lived (days), show a "last active" timestamp. Stale ones fade. This makes the locked rows feel like transient working sessions, not permanent secret rooms.
- **Distinct visual register from topic conversations** — tinted background, dashed border, lock chip on the huddle detail header itself. Reinforces "you are in private side-space" so the level isn't ambiguous.

The Huddles tab can show a list view with these row treatments without any new top-level UI.

## 2. Highlights / Timeline — MVP scope

### Where the team is aligned
- Kill the manual highlight shortcut. Resolution stays as the one act-on-message primitive.
- Conversation graph as invisible plumbing is fine — that's a technical decision with no UX surface, defer it.

### Cut: only one AI surface for MVP

Jan's proposal kept *two* AI surfaces (Topic Timeline + Conversation Highlights sidebar). For MVP, keep **one**, and make it the Topic Timeline.

Reasons:
- Conversation-level Highlights are solving "long thread is overwhelming." Slack's summarize-thread feature is the precedent — Jan flags he doesn't think it's used much. That's a strong signal not to ship it speculatively.
- If long threads are actually the problem, the cheaper fix is structural (better pinned message, clearer thread anchoring, resolution surfaced near the top) — not AI summary.
- Topic-level Timeline solves a use case Jan articulates well (the stakeholder who only cares whether the bug is progressing). Real, distinct job. Ship that.
- Two AI-generated surfaces means two "freshness" problems, two trust problems, two layout costs. Halve the surface, double the focus.

### On the "highlight of peek for a while" concern
Apply that same test to Timeline. If Timeline can only justify itself as "an AI feature we built because it was novel," cut it. If it earns its spot on the stakeholder-catchup job alone, keep it — but ship it **collapsed/on-demand by default**, not as permanent sidebar real estate. A "Catch me up" affordance in the topic header that expands the timeline panel is much cheaper than committing the sidebar to it forever.

### On Jan's permanent two-panel layout
Resist this for MVP. He's right that it costs the Slack reply-in-sidebar pattern. He's also right that it forces dual-panel attention. Both are real costs paid daily. The benefit (always-visible meta) is paid for an unproven feature. Make the layout *capable* of a right panel (already exists via ThreadPanel — same slot), but don't *commit* the layout to always showing one. Let the user open it.

### Proposed MVP cut
1. No manual highlight shortcut. Resolution only.
2. Topic-level Timeline — yes, but collapsed/on-demand, opens into the right slot.
3. Conversation-level Highlights sidebar — skip. Revisit if thread overwhelm becomes a reported problem.
4. Conversation graph exists in the background powering (2). Same plumbing, fewer surfaces.

This gives one new AI surface to evaluate honestly post-launch instead of two muddled ones, and preserves the existing reply-in-sidebar interaction.

## 3. Starting a topic from a DM (locked design)

### Mental model
A DM that "becomes a topic" really means: **the DM gets adopted as the first huddle of a new topic.** The DM doesn't disappear, doesn't get re-parented, doesn't become public. It just gains a new identity — "this conversation now lives inside Topic X as a huddle." Same participants, same history, same privacy. What changes is that there's now a public topic *around* it where outcomes can be shared.

This is the same primitive as a huddle started inside an existing topic. One concept, two entry points.

### Entry point
Message-level **Utilities menu → "Start topic"** (renamed from "Create topic"). Single entry point — no separate DM-header affordance, no message-level highlight shortcut. The user picks a specific message that crystallized the decision and starts a topic from there.

### Dialog: "Start topic"

Fields (in order):
- **Title** (required) — topic title.
- **Invite** — chips, defaults pre-filled with the DM's participants. Can add more. Added people join the public topic but **not** the huddle.

No description. No first message. No source-message preview. No seed checkbox.

**Privacy banner** (below the fields):
> This DM becomes a private huddle inside the new topic. Only you and the other DM participants can see it — the topic itself is public.

CTA: **Start topic**

### What happens on submit
1. New topic gets created (public, like all topics).
2. The DM transitions in place into a huddle within that topic. Same thread of messages, same participants. The DM gains a topic-context badge.
3. The user lands on the new topic's main page — empty Conversations tab, single huddle visible in the Huddles tab (the just-promoted DM).

### Empty state of the new topic
> Started from a DM with Sarah and Mark — continue the conversation in your huddle, or post here to bring others in.

### How the (former) DM signals its new topic context

**Conversation header** (replaces the dashed circle + title pattern used for regular topic conversations):

> 🔒 **Huddle in** [Pricing strategy Q2](#)

- Lock icon at the start = privacy marker.
- "Huddle in" = the structural relationship, no separate "Huddle" label needed.
- Topic name is the **only** linked element — clicking navigates up to the topic. The lock + "Huddle in" prefix is not part of the click target.
- Same component slot as the topic-title header for regular conversations. Presence of "🔒 Huddle in" tells you you're in a side-space; absence means main public flow.

**Inline divider in the conversation history**, placed at the moment of promotion:

> — Started topic [Pricing strategy Q2](#) · Apr 30 —

So people scrolling back can see when the context shifted. No system message scar on individual messages — the transition is a property of the container, not the messages.

**Sidebar DM row**: no change for MVP. Promoted DMs stay in the DMs list; the topic context only surfaces inside the conversation header. Revisit if it becomes a navigation problem.

### Why this works with the new model
- **One private primitive, two entry points.** A huddle started from inside a topic and a huddle promoted from a DM are the same object.
- **DMs stay DMs.** Not deleted, not re-parented, not made public. Participant list unchanged.
- **Public topic starts clean.** Empty Conversations tab. The huddle holds the working conversation. New people invited to the topic see *outcomes* via topic conversations and resolution — they don't get retroactive access to the DM history.
- **No Highlight dependency.** With the manual highlight shortcut cut for MVP, "Start topic" is the right direct primitive — single-step, lands users in the right place.

### Open question for v2
A DM can only be a huddle in *one* topic at a time. If users want a single DM to seed multiple topics over time, options are: (a) accept the constraint — most won't hit it; (b) allow re-promotion later, where the DM-as-huddle moves to the new topic; (c) allow multiple parents (breaks the mental model — reject). Ship (a) for MVP.
