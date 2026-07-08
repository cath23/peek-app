import type { Meta, StoryObj } from '@storybook/react-vite'
import { HuddleCreator } from './HuddleCreator'

const meta = {
  title: 'Components/HuddleCreator',
  component: HuddleCreator,
  parameters: { layout: 'padded' },
  decorators: [
    Story => (
      <div className="w-[520px]">
        <Story />
      </div>
    ),
  ],
  args: {
    topicTitle: 'Ongoing onboarding issues',
    onCancel: () => {},
    onCreate: () => {},
  },
} satisfies Meta<typeof HuddleCreator>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Start-a-huddle picker. Type a name in the To: field to see suggestions; Enter or click adds a
 * recipient chip and swaps the hint for the first-message composer. With no recipients yet it
 * shows the "Add at least one person" hint (matching the composer's height so nothing jumps).
 */
export const Default: Story = {}
