import type { Meta, StoryObj } from '@storybook/react-vite'
import ReactionPicker from './ReactionPicker'

const meta = {
  title: 'Messages/Menus/ReactionPicker',
  component: ReactionPicker,
  args: {
    onSelect: () => {},
  },
} satisfies Meta<typeof ReactionPicker>

export default meta
type Story = StoryObj<typeof meta>

/** The hover emoji row shown from the card quick-menus. */
export const Default: Story = {}
