import type { Meta, StoryObj } from '@storybook/react-vite'
import { ConversationHeader } from './ConversationHeader'

const members = ['Alice Johnson', 'Jake Walter', 'Zack Bright', 'Amie Miles']

const meta = {
  title: 'Components/ConversationHeader',
  component: ConversationHeader,
  parameters: { layout: 'fullscreen' },
  decorators: [
    Story => (
      <div className="w-[860px] max-w-full bg-bg-surface">
        <Story />
      </div>
    ),
  ],
  args: {
    onToggleStarred: () => {},
  },
} satisfies Meta<typeof ConversationHeader>

export default meta
type Story = StoryObj<typeof meta>

/** Topic header: status icon + title, open/resolved counts, members pill, start-huddle, star, more. */
export const Topic: Story = {
  args: {
    name: 'Feedback on mobile onboarding flow',
    topicMode: true,
    openCount: 6,
    resolvedCount: 0,
    members,
    onStartHuddle: () => {},
  },
}

/** Fully-resolved topic — icon + counts go green. */
export const TopicResolved: Story = {
  args: {
    name: 'Remote work policy clarifications',
    topicMode: true,
    isResolved: true,
    openCount: 0,
    resolvedCount: 4,
    members,
    onStartHuddle: () => {},
  },
}

/** DM header: sender avatar + name, star + more (no counts or members pill). */
export const Dm: Story = {
  args: {
    name: 'Amie Miles',
  },
}

/** Starred DM — the star fills amber. */
export const DmStarred: Story = {
  args: {
    name: 'Amie Miles',
    isStarred: true,
  },
}

/** Huddle header (V2 main view): lock icon + member names + members pill. */
export const Huddle: Story = {
  args: {
    name: 'Greg Bothman, Alice Johnson',
    huddleMode: true,
    members: ['You', 'Greg Bothman', 'Alice Johnson'],
  },
}
