/**
 * Precomputed timeline entries + thread checkpoints for the Intelligence
 * prototype. The entry SKELETON (kinds, times, anchors) is structural fact;
 * the `sentence` is the only "AI-written" part - and resolution entries reuse
 * the human resolution message verbatim.
 */

export type TimelineEntryKind = 'topic-created' | 'new-conversation' | 'new-replies' | 'resolution'

export interface TimelineEntry {
  id: string
  kind: TimelineEntryKind
  dateLabel: string
  time: string
  /** One sentence; occurrences of `actors` names render bold. */
  sentence: string
  actors: string[]
  /** Clicking the entry opens this conversation's thread. */
  anchorConvId: string
}

export const TOPIC_TIMELINES: Record<string, TimelineEntry[]> = {
  // Topic 3: Ongoing onboarding issues
  '3': [
    {
      id: 'tl3_1',
      kind: 'topic-created',
      dateLabel: 'Mon, August 18',
      time: '9:08 AM',
      sentence: 'Jake Walter created a public topic Ongoing onboarding issues',
      actors: ['Jake Walter'],
      anchorConvId: 't3_c1',
    },
    {
      id: 'tl3_2',
      kind: 'new-replies',
      dateLabel: 'Mon, August 18',
      time: '9:45 AM',
      sentence:
        'Jake Walter traced the added friction to compliance steps shipped under deadline pressure; a full flow review is planned',
      actors: ['Jake Walter'],
      anchorConvId: 't3_c1',
    },
    {
      id: 'tl3_3',
      kind: 'new-conversation',
      dateLabel: 'Today',
      time: '10:22 AM',
      sentence:
        "Greg Bothman's funnel data pinned the drop-off on the liveness check: 41% of users who reach it never complete it",
      actors: ['Greg Bothman'],
      anchorConvId: 't3_c2',
    },
    {
      id: 'tl3_4',
      kind: 'resolution',
      dateLabel: 'Today',
      time: '11:00 AM',
      sentence: 'Root cause confirmed: liveness check UX. SDK upgrade and UX rework underway.',
      actors: [],
      anchorConvId: 't3_c2',
    },
    {
      id: 'tl3_5',
      kind: 'new-conversation',
      dateLabel: 'Today',
      time: '11:15 AM',
      sentence:
        'Greg Bothman proposed shipping the SDK 3.4.2 upgrade as a quick win before the full UX rewrite; Zack Bright to own the sprint',
      actors: ['Greg Bothman', 'Zack Bright'],
      anchorConvId: 't3_c3',
    },
    {
      id: 'tl3_6',
      kind: 'new-replies',
      dateLabel: 'Today',
      time: '2:20 PM',
      sentence:
        'Alice Johnson compared two guidance-screen directions in Figma; the team chose Option A (static illustrations) over animation',
      actors: ['Alice Johnson'],
      anchorConvId: 't3_c4',
    },
    {
      id: 'tl3_7',
      kind: 'new-conversation',
      dateLabel: 'Today',
      time: '3:00 PM',
      sentence:
        "Jake Walter flagged that the error screen restarts the whole flow; a 'Try again' shortcut is going into the spec",
      actors: ['Jake Walter'],
      anchorConvId: 't3_c5',
    },
    {
      id: 'tl3_8',
      kind: 'resolution',
      dateLabel: 'Today',
      time: '4:10 PM',
      sentence: 'Spec updated: SDK 3.4.2 + illustration option A + retry shortcut. Going to QA next sprint.',
      actors: [],
      anchorConvId: 't3_c6',
    },
  ],
}

// ── Thread checkpoints (Catch me up) ──

export interface ThreadCheckpoint {
  id: string
  sentence: string
  /** First reply of the span this checkpoint covers - used to jump back. */
  anchorReplyId: string
  time: string
}

export const THREAD_CHECKPOINTS: Record<string, ThreadCheckpoint[]> = {
  t3_c4: [
    {
      id: 'cp_t3c4_1',
      sentence: 'Compared static illustrations vs looping animation; Option A chosen for simplicity and accessibility',
      anchorReplyId: 'r_t3c4_1',
      time: '2:00 PM',
    },
    {
      id: 'cp_t3c4_2',
      sentence: 'A tap-to-advance hybrid was considered and rejected - old-device performance data favors static',
      anchorReplyId: 'r_t3c4_5',
      time: '2:50 PM',
    },
    {
      id: 'cp_t3c4_3',
      sentence: 'Final assets shipped to Onboarding v2 › Guidance; step 2 copy humanized after review',
      anchorReplyId: 'r_t3c4_9',
      time: '3:30 PM',
    },
  ],
}
