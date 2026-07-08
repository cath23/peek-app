# Storybook Plan — Peek

Fresh Storybook on `main` (Storybook 10.4 + `@storybook/react-vite`, reuses `vite.config.ts` aliases and Tailwind). **Not** the monorepo branch — started from scratch by decision (2026-07-08).

## Scope decisions
- **Huddles: V3 (inline) only.** V3 renders: `HuddleCard variant="inStream"`, the inline huddle-creator block, ConversationHeader's start-huddle (LockPlus) button, ThreadPanel huddle mode, the promotion divider, the DM-origin banner.
- **Dropped (V1/V2 only — no stories):** `TopicTabs`, `StartHuddleDialog`, `HuddleCard variant="grid"`, Huddles-tab grid + New-Huddle tile, Timeline tab, TopicsPage sidebar SVG branch tree, V2 huddle main view.
- **Parked (AI/launcher features — revisit when implemented properly):** `CommandLauncher`, `FigmaFindPanel`, `SelectionToolbar`, `NewAgentDmDialog` + agent rows/chips, `FrameArt`, `FrameLightbox`, Figma attachment cards in ComposeBox/ConversationCard/ThreadReplyCard, `composerRegistry`/`launcherContext`.
  - Note: one seeded message (`dmData.ts` → Alice Johnson DM, `dm1_c6`) ships attachments, so attachment *display* is reachable without ⌘K. Decide: strip the seed or allow a display-only story later.

## Conventions
- Stories colocated: `src/components/**/X.stories.tsx`. CSF3, `satisfies Meta<typeof X>`.
- One story per meaningful variant axis + an **AllVariants matrix** story when axes are enumerable. Exemplar: `src/components/ui/Button.stories.tsx`.
- Interaction-gated states (hover/selected/unread) get explicit stories via props or pseudo-state wrappers.
- Theme toolbar (light/dark) is wired in `.storybook/preview.tsx` (toggles `dark` class). Check every story in both.
- Providers: add a `PeekProviders` decorator (`TopicMutationsProvider` + `MemoryRouter` + `DebugProvider` + `LastSelectionProvider`) when Tier 3+ needs it; mock data comes from `src/data/*`.
- Pixel fidelity: stories must match the app exactly — reuse primitives, never re-hand-roll markup.
- Per batch: `npx tsc -b` → visual pass in `npm run storybook` → commit.

## Story checklist (build order)

### Tier 1 — Atoms ✅ (all done 2026-07-08)
- [x] **Button** — 3 variants × 2 sizes × leadingIcon × disabled + matrix *(exemplar)*
- [x] **Avatar** — by-name, fallback placeholder, size scale
- [x] **IconButton** — muted/outlined/primary × disabled × tooltip + matrix
- [x] **Chip** — 6 types, icon slots, "1 new", count-only + matrix
- [x] **Divider** + [x] **DateDivider** — plain, long label, sticky-in-scroll demo
- [x] **Tooltip / WithTooltip** — static surface + hover top/bottom
- [x] **EmptyState** — default, custom icon/message
- [x] **HighlightPill + HighlightSwatch** — 5 types + swatch row
- [x] **Reaction** — yours vs others, double-digit, row
- [x] **TopicState** — all 6 types, resolved, group count, DM avatar + matrix
- [x] **ReferenceChip** — linear/PR/build/ticket/unmatched + in-text paragraph
- [x] **Toast** — extracted presentational `src/components/ui/Toast.tsx` from `src/lib/toast.tsx` (provider now renders it); 3 types × icon × action + matrix

### Tier 2 — Molecules
- [ ] **SearchInput** — shortcut chip, focus, filled
- [ ] **PersonRow** — 6 types × selected × unread × urgent+unread × hover (remove vs more) — fix gaps #10/#11 first
- [ ] **SectionHeader** — chevron × expanded × actions × hover-reveal
- [ ] **PersonChipInput** — empty, chips, dropdown, excludeIds (agents pool parked)
- [ ] **MentionMenu** — People vs Urgent header, highlight row
- [ ] **TopicMenu** — highlight, resolved/unresolved rows
- [ ] **ReactionPicker** — single form (note: default export)
- [ ] **StarredSection** — empty guidance, populated, collapsed, selected — add urgent (#12), onRemove (#14)
- [ ] **ContainerHeader** — leadingIcon × chevron × 3 actions × more slot

### Tier 3 — Menus
- [ ] **FilesMenu** — level 1, level 2 drilled, filtered; keyboard highlight; doc-type + brand icons
- [ ] **ConversationQuickMenu** — resolved vs unresolved
- [ ] **ConversationMoreMenu** — topic/start-topic/neither × resolved × own-message × highlight submenu (5 types + remove)
- [ ] **DebugMenu** — categorized rows, active options (needs DebugProvider)

### Tier 4 — Cards & message pieces
- [ ] **MessageBody** — ⚠ extract from ConversationCard first; paragraphs, bullet/numbered lists, @-mentions, topic chips (resolved/unresolved), file chips, reference chips
- [ ] **ConversationCard** — plain / topic-anchor / resolved banner / urgent / unread dot / "1 new" chips (brand + warning) / reactions / reply counts / highlight pill / selected / hover quick-menu / edit mode (incl. resolution block) / dm-context — fix gaps #1/#2/#3 first
- [ ] **ThreadReplyCard** — display vs edit, new / new+urgent borders, reactions, highlight, ownsResolution edit — fix gap #5
- [ ] **HuddleCard (inStream only)** — default, selected, hover menu, empty, reply counts — add unread/urgent (#6) + resolved (#7) first
- [ ] **ScreenerSection** — topic vs person items, resolved icons, collapsed, count chip — add urgency (#8); stories wire onOpen/onLater (#9)
- [ ] **PinnedMessage** — ⚠ promote from ThreadPanel local; highlight pill, truncation

### Tier 5 — Dialogs
- [ ] **ResolveDialog** — empty vs message
- [ ] **CreateTopicDialog** — default vs dmContext privacy banner, disabled confirm

### Tier 6 — Composer
- [ ] **ComposeBox** — default vs reply placeholder, urgent/highlight left border, slash menu (highlights + shortcuts), highlight picker, send disabled/enabled (attachments parked)
- [ ] **HuddleCreator** — ⚠ extract from `useTopicView` (rebase on PersonChipInput); empty, chips, suggestions, placeholder-vs-composer footer

### Tier 7 — Panels & chrome
- [ ] **ConversationHeader** — avatar/topic/huddle/group leading icon, open·resolved counts (fix #16 zero-counts), members pill, star toggle, start-huddle button, badge slot
- [ ] **ThreadPanel** — DM vs huddle mode, resolved, promotion divider (resolved/unresolved), open-original, member pill
- [ ] **NavItem / NavRail** — active/inactive per route (MemoryRouter)
- [ ] **TopBar** — theme menu open, debug anchor (Theme + Debug providers)
- [ ] **AppShell** — expanded vs collapsed

## Extractions required along the way
Blocking a story: `Toast` (presentational), `MessageBody`, `PinnedMessage`, `HuddleCreator`.
High-value dedup (do in the same tier as their story): `MessageHeader` (avatar+name+timestamp+pill, 3×), `ResolutionBanner` (3×), `ConversationCardList` (sticky DateDivider + card list, ~7×), Desk sections → reuse `SectionHeader` (3× hand-rolled in DeskPage), `SidebarPanel` scaffold (3 pages), `MemberAvatarPill` (ThreadPanel), `Kbd` badge.
Optional: `TopicOriginBanner`, `MessageEditor`, `ComposeFooter`, `EmptyConversationPanel`, sticky prop on `DateDivider`.

## State-gap checklist (from 2026-07-08 audit)
Blocking distinct stories:
1. ConversationCard: `isUrgent` alone renders nothing (warning chrome gated on new flags) — `ConversationCard.tsx:582-591,720-726,789-794`
2. ConversationCard: `hasNewReply` invisible unless `replyCount > 0` — `:775-794`
3. `useTopicView` never forwards `isUrgent` to ConversationCard (only DM view does) — urgent topic cards unreachable
5. ThreadReplyCard: `isUrgent` alone renders nothing (needs `isNew`) — `:577-584,633-639`
6. HuddleCard: no unread/urgent props at all
7. HuddleCard: `huddle.state === 'resolved'` never rendered
8. ScreenerSection: no urgency treatment; `ScreenerItem` lacks the field
10. PersonRow: `isUrgent` only renders when `isUnread` — urgent-but-read has no treatment
12. StarredItem lacks `isUrgent`; starred urgent rows impossible
18. Desk Open-Work rows never pass `isUrgent`
19. DeskPage re-implements Starred inline (doesn't reuse StarredSection) and drops `isUrgent`
20. PeoplePage/TopicsPage rows never pass `isUrgent` — urgency only visible in Desk › Urgent

Cosmetic / data gaps: #4 V2 huddle cards drop flags (V2 dropped anyway), #9 ScreenerSection onOpen/onLater unwired in app, #11 hover hides unread/urgent indicator on PersonRow, #13 StarredItem.memberCount never populated, #14 StarredSection lacks onRemove, #15 no header unread/urgent treatment, #16 "0 open · 0 resolved" shown for empty topics, #17 no urgent-topic seed for Desk, #21 sidebar huddle rows carry no unread (V2 — dropped), #22 no topic conversation sets `isUrgent` in seeds, #23 no urgent-without-new reply seed, #24 Open-Work/Starred seeds never set `isUnread`.

**Decision (2026-07-08): urgent is a modifier of unread — the warning treatment disappears once read.** Findings #1, #5, #10 are therefore by design, not bugs: stories must always pair `isUrgent` with the matching unread/new flag, and no standalone-urgent treatment gets built. Still real gaps: #3 (`useTopicView` drops `isUrgent`, so urgent+unread topic cards can't render), #6/#7 (HuddleCard), #8 (Screener), #12/#18/#19/#20 (urgent+unread rows impossible on Starred/Open-Work/People/Topics surfaces).
