import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { PEOPLE } from '@/api'
import { MentionMenu } from './MentionMenu'

const meta = {
  title: 'Messages/Composer/MentionMenu',
  component: MentionMenu,
  args: {
    people: PEOPLE.slice(0, 5),
    highlight: 0,
    isUrgent: false,
    onSelect: () => {},
    onHighlightChange: () => {},
  },
  argTypes: {
    people: { control: false },
  },
  render: function Render(args) {
    const [highlight, setHighlight] = useState(args.highlight)
    return (
      <MentionMenu
        {...args}
        highlight={highlight}
        onHighlightChange={setHighlight}
      />
    )
  },
} satisfies Meta<typeof MentionMenu>

export default meta
type Story = StoryObj<typeof meta>

/** The @-mention dropdown; the highlighted row shows the Enter hint. */
export const People: Story = {}

/** Triggered by !@ — same list, "Urgent mention" header. */
export const Urgent: Story = {
  args: { isUrgent: true },
}

export const SingleMatch: Story = {
  args: { people: PEOPLE.slice(0, 1) },
}
