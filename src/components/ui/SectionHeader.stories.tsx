import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { SectionHeader } from './SectionHeader'

const meta = {
  title: 'UI/SectionHeader',
  component: SectionHeader,
  args: {
    title: 'Teams',
  },
  render: args => (
    <div className="w-72">
      <SectionHeader {...args} />
    </div>
  ),
} satisfies Meta<typeof SectionHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Hover to reveal the action buttons (Add + Sort). */
export const WithActions: Story = {
  args: { prop1stAction: true, prop2ndAction: true },
}

/** Click to toggle; the chevron rotates with the expanded state. */
export const WithChevron: Story = {
  render: function Render(args) {
    const [expanded, setExpanded] = useState(true)
    return (
      <div className="w-72">
        <SectionHeader
          {...args}
          chevron
          isExpanded={expanded}
          onToggle={() => setExpanded(v => !v)}
        />
        {expanded && (
          <p className="px-2 py-1 text-[12px] text-text-muted leading-[1.4]">Section content</p>
        )}
      </div>
    )
  },
}

export const Collapsed: Story = {
  args: { chevron: true, isExpanded: false },
}
