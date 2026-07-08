import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconHelp } from '@tabler/icons-react'
import { DebugProvider } from '@/lib/debug'
import { DebugMenu } from './DebugMenu'

/**
 * DebugMenu portals to `document.body` and positions itself off an anchor's
 * bounding rect, so the story renders a real anchor button and hands it over
 * once mounted.
 */
function DebugMenuHarness() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  return (
    <>
      <button
        ref={setAnchor}
        className="flex items-center justify-center size-8 rounded-md bg-bg-inset text-text-secondary"
        aria-label="Debug"
      >
        <IconHelp size={18} stroke={1.5} />
      </button>
      <DebugMenu anchorEl={anchor} onClose={() => {}} />
    </>
  )
}

const meta = {
  title: 'Components/DebugMenu',
  component: DebugMenu,
  decorators: [
    Story => (
      <DebugProvider>
        <Story />
      </DebugProvider>
    ),
  ],
  // Real props come from the harness; these satisfy the typed Meta.
  args: { anchorEl: null, onClose: () => {} },
  render: () => <DebugMenuHarness />,
} satisfies Meta<typeof DebugMenu>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The top-bar "?" scenario switcher: Desk (Screener/Urgent/Open work/Starred),
 * Unreads, and the three Huddle layout variants. Toggles are live — driven by
 * the story's own DebugProvider.
 */
export const Default: Story = {}
