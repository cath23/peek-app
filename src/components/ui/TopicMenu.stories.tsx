import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { TOPICS } from '@/api'
import { TopicMutationsProvider } from '@/lib/topicMutations'
import { TopicMenu } from './TopicMenu'

const meta = {
  title: 'UI/TopicMenu',
  component: TopicMenu,
  decorators: [
    Story => (
      <TopicMutationsProvider>
        <Story />
      </TopicMutationsProvider>
    ),
  ],
  args: {
    topics: TOPICS.slice(0, 6),
    highlight: 0,
    onSelect: () => {},
    onHighlightChange: () => {},
  },
  argTypes: {
    topics: { control: false },
  },
  render: function Render(args) {
    const [highlight, setHighlight] = useState(args.highlight)
    return <TopicMenu {...args} highlight={highlight} onHighlightChange={setHighlight} />
  },
} satisfies Meta<typeof TopicMenu>

export default meta
type Story = StoryObj<typeof meta>

/** The [topic-mention dropdown — resolved topics show the green check (via TopicMutations). */
export const Default: Story = {}

export const SingleMatch: Story = {
  args: { topics: TOPICS.slice(3, 4) },
}
