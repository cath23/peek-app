import type { Meta, StoryObj } from '@storybook/react-vite'
import { ComposeBox } from './ComposeBox'

const meta = {
  title: 'Messages/Composer/ComposeBox',
  component: ComposeBox,
  parameters: { layout: 'padded' },
  decorators: [
    Story => (
      <div className="w-[560px]">
        <Story />
      </div>
    ),
  ],
  args: {
    onSend: () => {},
  },
} satisfies Meta<typeof ComposeBox>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The topic / DM composer. Interactive states (type to trigger them): `/` opens the slash
 * menu (Highlights + Shortcuts), `!@` turns the composer urgent (thick left bar), the
 * highlighter button pins a highlight, and Enter sends (Shift+Enter = newline).
 */
export const Default: Story = {}

/** Reply composer — the "Reply..." placeholder used inside the thread panel. */
export const Reply: Story = {
  args: { placeholder: 'reply' },
}
