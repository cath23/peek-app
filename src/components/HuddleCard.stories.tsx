import type { Meta, StoryObj } from '@storybook/react-vite'
import { TopicMutationsProvider } from '@/lib/topicMutations'
import { TOPIC_HUDDLES } from '@/api/fixtures'
import { HuddleCard } from './HuddleCard'

// V3 inline huddles only (grid variant is V1/V2 — out of scope).
const activeHuddle = TOPIC_HUDDLES['3'][0] // You + Greg + Amie, seed message + replies
const emptyHuddle = TOPIC_HUDDLES['9'][1] // members only, no seed message
const resolvedHuddle = TOPIC_HUDDLES['1'][0] // state: 'resolved', carries a resolution message

const meta = {
  title: 'Components/HuddleCard',
  component: HuddleCard,
  parameters: { layout: 'padded' },
  decorators: [
    Story => (
      <TopicMutationsProvider>
        <div className="w-[520px]">
          <Story />
        </div>
      </TopicMutationsProvider>
    ),
  ],
  args: {
    huddle: activeHuddle,
    variant: 'inStream',
  },
  argTypes: {
    huddle: { control: false },
  },
} satisfies Meta<typeof HuddleCard>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The inline (V3) huddle card: grey "Huddle" banner, lock avatar, member names,
 * one-line preview, and a live reply count. Hover reveals reply + more actions.
 */
export const Default: Story = {}

/** Selected (its thread is open) — highlighted background. */
export const Selected: Story = {
  args: { isSelected: true },
}

/** A members-only huddle with no seed message yet — "No messages yet" preview, no reply footer. */
export const Empty: Story = {
  args: { huddle: emptyHuddle },
}

/** New reply in the huddle — blue border + blue "1 new" chip (mirrors ConversationCard). */
export const NewReply: Story = {
  args: { hasNewReply: true },
}

/** Urgent is a modifier of new: paired together the border + chip go amber. */
export const UrgentReply: Story = {
  args: { hasNewReply: true, isUrgent: true },
}

/** New top-level message — blue border + blue dot in the header. */
export const NewMessage: Story = {
  args: { hasNewMessage: true },
}

/** A resolved huddle — green resolution banner with the outcome message. */
export const Resolved: Story = {
  args: { huddle: resolvedHuddle },
}
