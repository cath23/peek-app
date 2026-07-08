import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { Tooltip } from './Tooltip'
import { WithTooltip } from './WithTooltip'

const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  args: {
    label: 'Add to starred',
  },
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

/** The static tooltip surface. */
export const Default: Story = {}

/** Hover the button — WithTooltip portals the tooltip above the trigger. */
export const OnHoverTop: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <WithTooltip label="Add to starred" placement="top">
      <Button variant="outlined">Hover me</Button>
    </WithTooltip>
  ),
}

/** Bottom placement. */
export const OnHoverBottom: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <WithTooltip label="Sort by" placement="bottom">
      <Button variant="outlined">Hover me</Button>
    </WithTooltip>
  ),
}
