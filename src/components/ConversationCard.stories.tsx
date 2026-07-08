import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { PeekDataProvider } from '@/api'
import { ConversationCard } from './ConversationCard'

const meta = {
  title: 'Messages/ConversationCard',
  component: ConversationCard,
  parameters: { layout: 'padded' },
  decorators: [
    Story => (
      <MemoryRouter>
        <PeekDataProvider>
          <div className="w-[560px]">
            <Story />
          </div>
        </PeekDataProvider>
      </MemoryRouter>
    ),
  ],
  args: {
    authorName: 'Daniel Stanton',
    timestamp: '11:08 AM',
    body: 'Found the root cause — a dependency bump broke the build. Pinning it back now; will confirm once it goes green.',
  },
} satisfies Meta<typeof ConversationCard>

export default meta
type Story = StoryObj<typeof meta>

/** Resting card: avatar, author, time, body. Hover it to reveal the quick-action toolbar. */
export const Default: Story = {}

export const WithReactions: Story = {
  args: {
    reactions: [
      { emoji: '🙏', count: 3, owner: 'others' },
      { emoji: '🚀', count: 1, owner: 'yours' },
    ],
  },
}

export const WithReplies: Story = {
  args: { replyCount: 3 },
}

/** New top-level message — soft blue border + blue dot by the author's name. */
export const Unread: Story = {
  args: { hasNewMessage: true },
}

/** Unread reply — blue "1 new" chip next to the reply count. */
export const UnreadReply: Story = {
  args: { replyCount: 3, hasNewReply: true },
}

/**
 * Urgent is a modifier of unread: paired with a new message it swaps the blue
 * treatment for amber — amber border + the alert badge instead of the dot.
 */
export const Urgent: Story = {
  args: { hasNewMessage: true, isUrgent: true },
}

/** Urgent unread reply — amber "1 new" chip. */
export const UrgentReply: Story = {
  args: { replyCount: 3, hasNewReply: true, isUrgent: true },
}

/** A highlighted message wears its colored type pill in the author line. */
export const Highlight: Story = {
  args: { highlightType: 'insight' },
}

/** Resolved: green double-check banner with "resolved" and the outcome message. */
export const Resolved: Story = {
  args: {
    isResolved: true,
    resolvedBy: 'Alice',
    resolutionMessage: 'Spec updated: SDK 3.4.2 + retry shortcut. Going to QA next sprint.',
    replyCount: 4,
  },
}

/** Selected (its thread is open) — highlighted background. */
export const Selected: Story = {
  args: { isSelected: true },
}

/** DM message that seeded a huddle — status-circle "Huddle in [Topic]" anchor (links to the topic). */
export const HuddleAnchor: Story = {
  args: {
    huddleContext: { topicId: '3', topicTitle: 'Ongoing onboarding issues' },
    authorName: 'You',
  },
}

/** Inline chips: `@`/`!@` mentions, `[Topic]`/`[File]` refs, auto-linked references. */
export const InlineTokens: Story = {
  args: {
    body:
      'Pinging @Alice Johnson and !@Greg Bothman — ties into [Ongoing onboarding issues] and [Onboarding flow screens]. Fix is in PR #1234, tracked as PEEK-142; verify build #5102.',
    replyCount: 2,
  },
}
