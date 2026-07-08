import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './ui/Button'
import { ContainerHeader } from './ContainerHeader'

const meta = {
  title: 'Components/ContainerHeader',
  component: ContainerHeader,
  args: {
    title: 'People',
  },
  argTypes: {
    more: { control: false },
  },
  render: args => (
    <div className="w-96 bg-bg-surface border border-border-default rounded-lg overflow-hidden">
      <ContainerHeader {...args} />
    </div>
  ),
} satisfies Meta<typeof ContainerHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithLeadingIconAndChevron: Story = {
  args: { title: 'Topics', leadingIcon: true, chevron: true },
}

/** Panel-level actions (1st = Edit, 2nd/3rd = Sort). */
export const WithActions: Story = {
  args: {
    prop1stAction: true,
    prop1stActionTooltip: 'New message',
    prop2ndAction: true,
    prop2ndActionTooltip: 'Sort by',
  },
}

/** Custom content in the `more` slot. */
export const WithMoreSlot: Story = {
  args: {
    title: 'Desk',
    more: (
      <Button variant="outlined" size="small">
        Clear all
      </Button>
    ),
  },
}
