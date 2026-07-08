# PeekApp — User Flow Inventory

Complete catalog of user flows and states for demo / prototyping / Figma mockup planning. Compiled by surveying [App.tsx](../src/App.tsx), the page components, and major UI components.

Use this as a checklist when building demo frames in Figma — each numbered flow is a candidate for its own frame (or a state stacked into a multi-state frame).

---

## A. Navigation & shell (always-visible)

| # | Flow | Implementation |
|---|---|---|
| 1 | First load → app routes to `/desk` | [App.tsx:9](../src/App.tsx#L9) |
| 2 | NavRail click → switch page (Desk / Topics / People / Views / Files) | [NavRail.tsx](../src/components/NavRail.tsx) |
| 3 | TopBar menu toggle → collapse/expand shell (NavRail + left panel hide) | [AppShell.tsx:12](../src/layouts/AppShell.tsx#L12) |
| 4 | TopBar search (⌘K) — placeholder, visible | [TopBar.tsx:52](../src/components/TopBar.tsx#L52) |
| 5 | TopBar theme menu (Light / Dark / System) | [TopBar.tsx:69](../src/components/TopBar.tsx#L69) |
| 6 | TopBar help — placeholder | [TopBar.tsx:57](../src/components/TopBar.tsx#L57) |
| 7 | Empty right panel (no item selected on any page) | RightPanel `mode=empty` |

## B. Topic flows (`/topics`)

| # | Flow | Implementation |
|---|---|---|
| 8 | Select topic → topic header (TopicState icon, title, "X open · Y resolved", MembersPill, Star/More) + tabs | [TopicsPage.tsx:308](../src/pages/TopicsPage.tsx#L308) |
| 9 | Switch tab: Conversations / Huddles / Timeline | [TopicsPage.tsx:315](../src/pages/TopicsPage.tsx#L315) |
| 10 | Conversations tab with grouped DateDividers | [TopicsPage.tsx:328](../src/pages/TopicsPage.tsx#L328) |
| 11 | Timeline tab → empty state | [TopicsPage.tsx:397](../src/pages/TopicsPage.tsx#L397) |
| 12 | Sort topics (left-panel ContainerHeader 2nd action) | [TopicsPage.tsx:285](../src/pages/TopicsPage.tsx#L285) |
| 13 | New topic (left-panel ContainerHeader 1st action → CreateTopicDialog) | [TopicsPage.tsx:286](../src/pages/TopicsPage.tsx#L286) |

## C. Conversation card states (Topic Conversations + DM)

| # | State | Trigger / Source |
|---|---|---|
| 14 | Default ConversationCard | base render |
| 15 | Hover with ConversationQuickMenu (React + Reply + Resolve + More) | mouse-enter |
| 16 | Selected (thread panel open for this card) | `isSelected={threadConvId === c.id}` |
| 17 | New message indicator (purple dot) | `hasNewMessage` |
| 18 | New replies indicator (chip "1 new") | `hasNewReply` |
| 19 | Urgent message (warning border + chip) | message starts with `!@` |
| 20 | Resolved (with banner: "X resolved → message") | `isResolved` |
| 21 | With reactions row | non-empty `reactions` array |
| 22 | With highlight pill (insight / concern / conclusion / question / summary) | `highlightType` set |
| 23 | With reply count | `replyCount > 0` |

## D. Conversation actions

| # | Flow | Implementation |
|---|---|---|
| 24 | More menu — DM context (Create topic / Resolve / Open work / Mark as Highlight / Edit message / View details / Delete) | [ConversationMoreMenu.tsx](../src/components/ConversationMoreMenu.tsx) |
| 25 | More menu — Topic context (no Create topic row) | same, `isTopic=true` |
| 26 | More menu — resolved variant ("Reopen" instead of "Resolve") | same, `isResolved=true` |
| 27 | Highlight submenu (5 types + optional Remove row) | [ConversationMoreMenu.tsx](../src/components/ConversationMoreMenu.tsx) |
| 28 | Edit message → in-place EditMessageBox (avatar, paperclip/forbid, Cancel/Save) | [ConversationCard.tsx:781](../src/components/ConversationCard.tsx#L781) |
| 29 | Delete (no confirm dialog — just removes) | [TopicsPage.tsx:176](../src/pages/TopicsPage.tsx#L176) |
| 30 | React with emoji (ReactionPicker → Reaction pill) | [ConversationCard.tsx:849](../src/components/ConversationCard.tsx#L849) |

## E. Compose flows (ComposeBox)

| # | Flow | Trigger |
|---|---|---|
| 31 | Plain text send (Enter / Shift+Enter newline) | type & enter |
| 32 | @mention people → MentionMenu (mode=people) | type `@` |
| 33 | !@urgent mention → MentionMenu (mode=urgent — different header label) | type `!@` |
| 34 | [topic → TopicMenu (existing topics) | type `[` |
| 35 | [topic with no match → "Create new topic" → CreateTopicDialog | type `[xyz` no match |
| 36 | [file → FilesMenu Level 1 (Recents + Apps: GitHub / Figma / Linear) | type `[` (also files context) |
| 37 | FilesMenu Level 2 (browse inside an app) | click app row in L1 |
| 38 | FilesMenu search (Level 2 with query) | type after `[` |
| 39 | -> → ResolutionBlock (resolves parent on send) | type `->` |
| 40 | [#highlight → choose type from dropdown | type `[#` |
| 41 | Send button (arrow-up icon) | click or Enter |

## F. ResolveDialog flow

| # | Flow |
|---|---|
| 42 | Open from More menu → dialog with backdrop, optional textarea, Cancel / Resolve |
| 43 | Open from -> in compose → same dialog |
| 44 | After confirm → conversation shows resolution banner |

Files: [ResolveDialog.tsx](../src/components/ResolveDialog.tsx), [TopicsPage.tsx:134](../src/pages/TopicsPage.tsx#L134)

## G. CreateTopicDialog flow

| # | Flow |
|---|---|
| 45 | Title (required *), Description (optional), Invite people (search) → Cancel / Create topic |
| 46 | From [topic compose path |
| 47 | From left panel new-topic action |

Files: [CreateTopicDialog.tsx](../src/components/CreateTopicDialog.tsx)

## H. Thread panel (right-side overlay)

| # | Flow | Implementation |
|---|---|---|
| 48 | Conversation thread: header "Replies" + "Resolved" label (if applicable) + Close, PinnedMessage as initial, DateDivider, replies, ComposeBox (placeholder="reply") | [ThreadPanel.tsx](../src/components/ThreadPanel.tsx) |
| 49 | Huddle thread: header "Replies" + MembersPill + Close, full ThreadReplyCard as initial, replies | same, `huddleMemberCount` set |
| 50 | Reply card hover → quick menu (React + More) | [ThreadReplyCard.tsx](../src/components/ThreadReplyCard.tsx) |
| 51 | Reply more menu (Edit / Mark as Highlight / Delete) | same |

## I. Huddle flows (within a topic, Huddles tab)

| # | Flow | Implementation |
|---|---|---|
| 52 | Empty huddles state → EmptyState + "New Huddle" button | [TopicsPage.tsx:406](../src/pages/TopicsPage.tsx#L406) |
| 53 | Huddle grid odd count (cards + half-width NewHuddleButton sharing row) | [TopicsPage.tsx:441](../src/pages/TopicsPage.tsx#L441) |
| 54 | Huddle grid even count (cards + full-width NewHuddleButton on its own row) | same — `currentHuddles.length % 2 === 0` |
| 55 | HuddleCard states: default / hover (with quick menu) / selected | [HuddleCard.tsx](../src/components/HuddleCard.tsx) |
| 56 | Huddle quick menu (Reply + More) | same |
| 57 | Huddle more menu (View details / Delete) | same, [HuddleCard.tsx:170](../src/components/HuddleCard.tsx#L170) |
| 58 | Create huddle: To: field → @ suggestions → recipient chips → compose → send | [TopicsPage.tsx:456](../src/pages/TopicsPage.tsx#L456) |
| 59 | Active huddle thread (selected card + thread panel open with member avatars) | [TopicsPage.tsx:543](../src/pages/TopicsPage.tsx#L543) |

## J. People / DM flows (`/people`)

| # | Flow | Implementation |
|---|---|---|
| 60 | DM list in left panel (people + teams sections) | [PeoplePage.tsx:18](../src/pages/PeoplePage.tsx#L18) |
| 61 | Select person → DM panel (plain header, conversations, compose) | [PeoplePage.tsx:215](../src/pages/PeoplePage.tsx#L215) |
| 62 | Select team → team conversations | same |
| 63 | All conversation actions from C/D/E apply (no topic-specific options) | — |
| 64 | DM thread panel (no MembersPill since 1:1) | — |

## K. Edge / system states

| # | Flow |
|---|---|
| 65 | Light theme rendering of any flow above |
| 66 | System theme (matches OS preference) |
| 67 | Tooltip hovers (every IconButton) |
| 68 | Long names truncating with ellipsis (header / cards) |

---

## Suggested Figma demo frames (~15–20 total)

Many flows collapse — e.g., one ConversationCard frame can stack 8 states. Recommended slice for an end-to-end product walkthrough:

| Frame | Content |
|---|---|
| 1 | AppShell — Desk (empty state) |
| 2 | Topic page — Conversations tab, multiple card states visible |
| 3 | Topic page — Conversations + thread panel open |
| 4 | Topic page — Huddles tab (empty) |
| 5 | Topic page — Huddles tab (odd count, half-button) |
| 6 | Topic page — Huddles tab (even count, full-button) |
| 7 | Topic page — Huddle thread panel open |
| 8 | Topic page — Timeline tab |
| 9 | People page — DM (selected) |
| 10 | People page — DM thread panel open |
| 11 | ResolveDialog (overlay over base) |
| 12 | CreateTopicDialog (overlay over base) |
| 13 | Compose with MentionMenu open |
| 14 | Compose with TopicMenu open |
| 15 | Compose with FilesMenu Level 1 |
| 16 | Compose with FilesMenu Level 2 |
| 17 | Compose with HighlightMenu |
| 18 | TopBar theme menu open |
| 19 | Edit message in ConversationCard |
| 20 | Light theme example (any frame in light mode) |

---

*Last reviewed: 2026-04-28 against the React implementation.*
