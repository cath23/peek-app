import type { Meta, StoryObj } from '@storybook/react-vite'
import { PinnedMessage } from './PinnedMessage'

const meta = {
  title: 'Messages/PinnedMessage',
  component: PinnedMessage,
  decorators: [
    Story => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
  args: {
    authorName: 'Alice Johnson',
    timestamp: '9:45 AM',
    body: 'Have you had a chance to look at the Zendesk ticket I flagged last week?',
  },
} satisfies Meta<typeof PinnedMessage>

export default meta
type Story = StoryObj<typeof meta>

/** The original message, pinned compact at the top of the thread panel. */
export const Default: Story = {}

/** Carries the highlight pill when the pinned message is a highlight. */
export const WithHighlight: Story = {
  args: { highlightType: 'question' },
}

/** Multi-line / long bodies are flattened to one line and truncated with an ellipsis. */
export const Truncated: Story = {
  args: {
    body:
      "Checked the error logs for EU-West-1.\nThere's a noticeable uptick in 503s from the identity verification service between 9am and 11am CET — looks like a capacity issue during peak hours.",
  },
}
