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
 * The topic stream at the moment the scenario cuts to Peek. A few messages
 * from the days before the call give the topic a history, and the highlights
 * row is the newest thing in it — nobody wrote it, the call did.
 */
export const DEMO_TOPIC_CONVERSATIONS: ConvGroup[] = [
  {
    dateLabel: 'Wed, September 3',
    convs: [
      {
        id: 'd1_c0',
        authorName: 'You',
        timestamp: '11:20 AM',
        body: "Opening this for the Stripe work so it doesn't live in six DMs. Everything about the payment flow goes here.\n\nWhat I have so far is a flow that assumes payments succeed, which is not a flow. I'd rather settle the failure cases with Stripe on the call than guess at them in Figma.",
        replyCount: 2,
        replyAuthors: [{ name: 'Amie Miles' }, { name: 'Juan Foley' }],
        lastReplyTime: '1:02 PM',
      },
      {
        id: 'd1_c0b',
        authorName: 'Juan Foley',
        timestamp: '3:48 PM',
        body: "I can wire up the test integration this week if someone gets us sandbox keys. Worth knowing which decline codes we actually have to handle before I write the error mapping.",
      },
    ],
  },
  {
    dateLabel: 'Fri, September 5',
    convs: [
      {
        id: 'd1_c1',
        authorName: 'Amie Miles',
        timestamp: '9:24 AM',
        body: "Stripe are on for Monday, 10:00. Their payments engineer @Bob Chen is joining, so this is our chance to settle the parts we've been guessing at.\n\nTwo things I want to come out of the call: which integration we're building against, and what happens when a payment fails.",
        replyCount: 3,
        replyAuthors: [{ name: 'Greg Bothman' }, { name: 'You' }],
        lastReplyTime: '10:41 AM',
      },
      {
        id: 'd1_c2',
        authorName: 'Alice Curtis',
        timestamp: '2:15 PM',
        body: "I'll bring the flow I sketched last week. It covers the happy path properly and the error states barely at all, which is roughly where my questions are.\n\nIf we can agree on the failure copy in the call I can have real screens by Wednesday.",
        reactions: [{ emoji: '👍', count: 3, owner: 'others' }],
      },
    ],
  },
  {
    dateLabel: 'Today',
    convs: [
      {
        id: 'd1_c3',
        authorName: 'Greg Bothman',
        timestamp: '9:52 AM',
        body: "Agenda for the kick off is in the topic files. Short version: integration choice, failure and 3DS states, then webhooks and reconciliation if there's time.\n\nJoining from the Meet link in the invite.",
        replyCount: 1,
        replyAuthors: [{ name: 'Juan Foley' }],
        lastReplyTime: '9:58 AM',
      },
      // The call's highlights, arriving on their own — the beat the scenario
      // is built around. Collapsed at first (beat 3), expanded at beat 4.
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
