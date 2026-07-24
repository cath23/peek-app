import type { Meta, StoryObj } from '@storybook/react-vite'
import { HighlightsCard, type HighlightsData } from './HighlightsCard'

const meta = {
  title: 'Messages/HighlightsCard',
  component: HighlightsCard,
  decorators: [
    Story => (
      <div className="w-[1038px] bg-bg-surface p-4 rounded-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HighlightsCard>

export default meta
type Story = StoryObj<typeof meta>

/** The Scenario 1 kick-off call fixture — matches the Figma reference
 *  (Payment integration topic, highlights arriving from a Meet call). */
const kickOffCall: HighlightsData = {
  id: 'hl_kickoff',
  title: 'Kick off call',
  timestamp: '10:30 AM',
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

/** Expanded — full content: title, highlight groups with pills, action items. */
export const Expanded: Story = {
  args: { data: kickOffCall, defaultExpanded: true },
}

/** Collapsed — the one-line bar (icon chip, label, type swatches, time, Expand). */
export const Collapsed: Story = {
  args: { data: kickOffCall, defaultExpanded: false },
}

/**
 * The block model is free-form — any mix of text, bullets, highlight groups,
 * and todos (with done state), not a fixed key-points/action-items shape.
 */
export const FlexibleContent: Story = {
  args: {
    defaultExpanded: true,
    data: {
      id: 'hl_flexible',
      title: 'Weekly sync',
      timestamp: '3:15 PM',
      blocks: [
        {
          kind: 'text',
          lines: ['Short call — mostly status. Launch date holds at Friday.'],
        },
        { kind: 'heading', text: 'Decisions' },
        { kind: 'bullets', items: ['Ship the SDK upgrade before the UX rewrite', 'Keep refunds behind the feature flag'] },
        {
          kind: 'highlight',
          type: 'concern',
          lines: ['Support volume is trending up ahead of launch.'],
        },
        { kind: 'heading', text: 'Follow-ups' },
        {
          kind: 'todos',
          items: [
            { text: 'Update the runbook', assignee: 'Amie Miles', done: true },
            { text: 'Book the launch retro', done: false },
          ],
        },
      ],
    },
  },
}
