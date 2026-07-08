import type { Meta, StoryObj } from '@storybook/react-vite'
import { PeekDataProvider } from '@/api'
import { SCREENER_ITEMS } from '@/api/fixtures'
import { ScreenerSection } from './ScreenerSection'

const noop = () => {}

const meta = {
  title: 'Components/ScreenerSection',
  component: ScreenerSection,
  decorators: [
    Story => (
      <PeekDataProvider>
        <div className="w-[300px] bg-bg-base p-2 rounded-lg">
          <Story />
        </div>
      </PeekDataProvider>
    ),
  ],
  args: {
    items: SCREENER_ITEMS,
    onOpen: noop,
    onLater: noop,
    onDismiss: noop,
  },
  argTypes: {
    items: { control: false },
  },
} satisfies Meta<typeof ScreenerSection>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The Desk Screener accordion: a count chip in the header, then the incoming items
 * ([ScreenerItem]) below. Click the header to collapse. (Per Peek's model there is no
 * urgent state here — urgent conversations skip the Screener and go to the Desk's Urgent lane.)
 */
export const Default: Story = {}

/** Single incoming item. */
export const OneItem: Story = {
  args: { items: [SCREENER_ITEMS[1]] },
}
