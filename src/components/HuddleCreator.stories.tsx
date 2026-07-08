import type { Meta, StoryObj } from '@storybook/react-vite'
import { PeekDataProvider } from '@/api'
import { HuddleCreator } from './HuddleCreator'

const meta = {
  title: 'Huddles/HuddleCreator',
  component: HuddleCreator,
  parameters: { layout: 'padded' },
  decorators: [
    // The To: field autofocuses on mount and its suggestion dropdown opens
    // UPWARD (bottom-full) — as it does in the app, where the creator sits at
    // the bottom above the composer. Give it a tall canvas and anchor the
    // component to the bottom so the ~200px dropdown has headroom above it.
    Story => (
      <PeekDataProvider>
        <div className="w-[520px] min-h-[380px] flex flex-col justify-end">
          <Story />
        </div>
      </PeekDataProvider>
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
