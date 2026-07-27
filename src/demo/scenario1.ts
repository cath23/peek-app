/**
 * Scenario 1 — "Highlights in Huddle" — the Peek-side dataset.
 *
 * Beats 3–4 of the scenario (see demo-scenarios/STORYBOARD.md) show the
 * Payment integration topic right after the kick-off call ended in Google
 * Meet: the highlights the call produced have just landed in the topic as a
 * collapsed bar, and then expand.
 *
 * So this overlay must agree with the Meet scenes, which are pixel-perfect
 * builds of the Figma boards:
 *   - the highlights content is the same object the Meet scene shows
 *     (demo-scenarios/src/scenes/MeetEnded.tsx — same key points, same three
 *     action items and assignees),
 *   - the cast is the call's cast, and the viewer ("You") is the Peek
 *     designer whose screen the whole scenario follows.
 *
 * Only what those beats show is overridden; everything else in demo mode is
 * the app's normal fixture data.
 */
import type { ConvGroup, HighlightsData, Person } from '@/api'
import demoDesigner from '@/assets/avatars/demo-designer.png'
import aliceCurtis from '@/assets/avatars/alice-johnson.png'

/** The topic the scenario plays out in (title comes from the topics fixture). */
export const DEMO_TOPIC_ID = '10'

/**
 * The scenario's protagonist: the viewer. Rendered as 'You' everywhere, so
 * only the portrait matters — it is a crop of the same webcam frame the Meet
 * call shows in her tile, which is what carries the identity across the cut
 * from Meet to Peek.
 */
export const DEMO_VIEWER_AVATAR = demoDesigner

/**
 * Cast members the app's fixture doesn't already have. Greg Bothman, Juan
 * Foley, Amie Miles and Bob Chen (the Stripe engineer) are in the fixture
 * with the same portraits the Meet highlights doc uses; Alice Curtis is the
 * scenario's designer and needs adding.
 */
export const DEMO_EXTRA_PEOPLE: Person[] = [
  { id: 'alice-curtis', name: 'Alice Curtis', role: 'Product Designer', avatarSrc: aliceCurtis },
]

/**
 * The highlights the kick-off call produced — the same content as the doc in
 * the Meet scene, now a first-class object in the topic. (The Storybook
 * fixture in HighlightsCard.stories.tsx is the same content; stories may not
 * import from here, so it keeps its own copy.)
 */
const KICK_OFF_HIGHLIGHTS: HighlightsData = {
  id: 'hl_kickoff',
  title: 'Kick off call',
  timestamp: '11:12 AM',
  blocks: [
    { kind: 'heading', text: 'Key points' },
    {
      kind: 'highlight',
      type: 'insight',
      lines: [
        'Went with Stripe Checkout for v1 instead of a custom card form.',
        'Walked through the failure and 3DS-declined states and where customers get stuck.',
      ],
    },
    {
      kind: 'highlight',
      type: 'question',
      lines: ['What does Stripe return after a 3DS decline, and which codes do we show the customer?'],
    },
    {
      kind: 'highlight',
      type: 'conclusion',
      lines: ['Agreed reconciliation needs a fallback in case a webhook is late.'],
    },
    { kind: 'heading', text: 'Action items' },
    {
      kind: 'todos',
      items: [
        { text: 'Draft the payment flow in Figma, including failure states', assignee: 'Alice Curtis' },
        { text: 'Scope webhooks and the reconciliation job as the first PR', assignee: 'Greg Bothman' },
        { text: 'Send Stripe test keys and the decline codes to handle', assignee: 'Juan Foley' },
      ],
    },
  ],
}

/**
 * Everyone in the topic. Nobody has written in it yet, so this is what the
 * members pill has to go on — the team set the topic up around the call.
 */
export const DEMO_TOPIC_MEMBERS = [
  'You',
  'Alice Curtis',
  'Greg Bothman',
  'Juan Foley',
  'Amie Miles',
  'Bob Chen',
]

/**
 * The topic at the moment the scenario cuts to Peek: empty except for the
 * highlights (user ruling 2026-07-27). Nobody has typed a word in here — the
 * first thing in the topic is what the call produced.
 */
export const DEMO_TOPIC_CONVERSATIONS: ConvGroup[] = [
  {
    dateLabel: 'Today',
    convs: [
      {
        id: 'd1_hl',
        authorName: 'Highlights',
        timestamp: KICK_OFF_HIGHLIGHTS.timestamp,
        body: '',
        highlights: KICK_OFF_HIGHLIGHTS,
      },
    ],
  },
]
