import type { Meta, StoryObj } from '@storybook/react-vite'
import { ScreenerLaterMenu } from './ScreenerLaterMenu'

/**
 * The Screener row's "Later" action: a button whose menu offers snooze
 * durations (In 1 hour / 3 hours / Tomorrow / In a week). Picking one returns
 * an absolute timestamp after which the item reappears. **Click "Later"** to
 * open the menu (it portals so it can escape the Desk panel's clip).
 */
const meta = {
  title: 'Screener & Desk/ScreenerLaterMenu',
  component: ScreenerLaterMenu,
  parameters: { layout: 'centered' },
  args: { onPick: () => {} },
} satisfies Meta<typeof ScreenerLaterMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
