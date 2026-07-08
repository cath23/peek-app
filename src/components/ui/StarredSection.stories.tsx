import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { StarredSection, type StarredItem } from './StarredSection'

const ITEMS: StarredItem[] = [
  { id: 1, name: 'Alice Johnson', type: 'DM' },
  { id: 2, name: 'CI/CD pipeline stuck during build stage', type: 'topic', isUnread: true },
  { id: 3, name: 'Remote work policy clarifications', type: 'topic', topicStatus: 'resolved' },
]

const meta = {
  title: 'UI/StarredSection',
  component: StarredSection,
  render: args => (
    <div className="w-72">
      <StarredSection {...args} />
    </div>
  ),
} satisfies Meta<typeof StarredSection>

export default meta
type Story = StoryObj<typeof meta>

/** No starred items — guidance copy. Click the header to collapse. */
export const Empty: Story = {}

export const Populated: Story = {
  args: { items: ITEMS },
}

/** Selection follows clicks. */
export const WithSelection: Story = {
  render: function Render() {
    const [selectedId, setSelectedId] = useState<number | null>(2)
    return (
      <div className="w-72">
        <StarredSection items={ITEMS} selectedId={selectedId} onSelect={setSelectedId} />
      </div>
    )
  },
}
