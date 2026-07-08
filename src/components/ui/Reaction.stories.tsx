import type { Meta, StoryObj } from '@storybook/react-vite'
import { Reaction } from './Reaction'

const meta = {
  title: 'UI/Reaction',
  component: Reaction,
  args: {
    emoji: '👍',
    count: 2,
    owner: 'others',
  },
  argTypes: {
    owner: { control: 'inline-radio', options: ['yours', 'others'] },
  },
} satisfies Meta<typeof Reaction>

export default meta
type Story = StoryObj<typeof meta>

/** Someone else reacted — inset surface, default border. */
export const Others: Story = {}

/** You reacted — accent surface and border. */
export const Yours: Story = {
  args: { owner: 'yours' },
}

export const DoubleDigit: Story = {
  args: { emoji: '🚀', count: 12 },
}

export const Row: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-1">
      <Reaction emoji="👍" count={3} owner="yours" />
      <Reaction emoji="💯" count={1} />
      <Reaction emoji="🎉" count={12} />
    </div>
  ),
}
