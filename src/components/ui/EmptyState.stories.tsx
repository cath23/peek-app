import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconLock } from '@tabler/icons-react'
import { EmptyState } from './EmptyState'

const meta = {
  title: 'Feedback/EmptyState',
  component: EmptyState,
  argTypes: {
    icon: { control: false },
  },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

/** Default icon and message ("No conversation selected"). */
export const Default: Story = {}

export const CustomMessage: Story = {
  args: { message: 'No topics yet. Start one from any conversation.' },
}

export const CustomIcon: Story = {
  args: {
    icon: <IconLock size={16} stroke={1.5} />,
    message: 'No huddles in this topic yet',
  },
}
