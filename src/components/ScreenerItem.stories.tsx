import type { Meta, StoryObj } from '@storybook/react-vite'
import { PeekDataProvider } from '@/api'
import { SCREENER_ITEMS } from '@/api/fixtures'
import { ScreenerItem } from './ScreenerItem'

const noop = () => {}

const meta = {
  title: 'Screener & Desk/ScreenerItem',
  component: ScreenerItem,
  decorators: [
    Story => (
      <PeekDataProvider>
        <div className="w-[300px]">
          <Story />
        </div>
      </PeekDataProvider>
    ),
  ],
  args: {
    item: SCREENER_ITEMS[0],
    onOpen: noop,
    onLater: noop,
    onDismiss: noop,
  },
  argTypes: {
    item: { control: false },
  },
} satisfies Meta<typeof ScreenerItem>

export default meta
type Story = StoryObj<typeof meta>

/** A topic item — topic status icon + title, two-line preview, Open / Later / ✕ Dismiss. */
export const TopicItem: Story = {}

/** A DM item — sender avatar + name. */
export const PersonItem: Story = {
  args: { item: SCREENER_ITEMS[1] },
}
