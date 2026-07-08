import type { Meta, StoryObj } from '@storybook/react-vite'
import { PeekDataProvider } from '@/api'
import { ThreadReplyCard } from './ThreadReplyCard'

const meta = {
  title: 'Components/ThreadReplyCard',
  component: ThreadReplyCard,
  parameters: { layout: 'padded' },
  decorators: [
    Story => (
      <PeekDataProvider>
        <div className="w-[520px]">
          <Story />
        </div>
      </PeekDataProvider>
    ),
  ],
  args: {
    authorName: 'Alice Johnson',
    timestamp: '2:14 PM',
    body: 'Confirmed on my end — the funnel drop is EU-only, matches the identity-service capacity theory.',
  },
} satisfies Meta<typeof ThreadReplyCard>

export default meta
type Story = StoryObj<typeof meta>

/** A resting reply. Hover reveals the react + more quick actions; more → Edit opens the inline editor. */
export const Default: Story = {}

export const WithReactions: Story = {
  args: {
    reactions: [{ emoji: '👍', count: 2, owner: 'others' }],
  },
}

/** A reply can carry a highlight type pill, same as a top-level message. */
export const Highlight: Story = {
  args: { highlightType: 'concern' },
}

/** New (unread) reply — soft blue border + blue dot by the author's name. */
export const New: Story = {
  args: { isNew: true },
}

/**
 * Urgent is a modifier of new: paired together the border and badge go amber.
 * (`isUrgent` without `isNew` renders no chrome — by design.)
 */
export const NewUrgent: Story = {
  args: { isNew: true, isUrgent: true },
}
