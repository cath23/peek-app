import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar } from './Avatar'

const meta = {
  title: 'UI/Avatar',
  component: Avatar,
  args: {
    name: 'Alice Johnson',
    size: 36,
  },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

/** Resolves the image from PEOPLE by author name. */
export const ByName: Story = {}

/** Unknown name (and no src) falls back to the accent-muted placeholder. */
export const Fallback: Story = {
  args: { name: 'Unknown Person' },
}

/** The size scale used across the app. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-end gap-3">
      {[16, 24, 32, 36].map(size => (
        <div key={size} className="flex flex-col items-center gap-1">
          <Avatar name="Alice Johnson" size={size} />
          <span className="text-caption text-text-muted">{size}</span>
        </div>
      ))}
    </div>
  ),
}
