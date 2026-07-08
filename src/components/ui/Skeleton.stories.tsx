import type { Meta, StoryObj } from '@storybook/react-vite'
import { SkeletonBar, SkeletonRow, SkeletonSidebarList, SkeletonConversationList } from './Skeleton'

const meta = {
  title: 'Feedback/Skeleton',
  component: SkeletonSidebarList,
} satisfies Meta<typeof SkeletonSidebarList>

export default meta
type Story = StoryObj<typeof meta>

/** Sidebar list placeholder (Topics/People/Desk left panels) — reveals after a 150ms delay so fast loads never flash it. */
export const SidebarList: Story = {
  decorators: [Story => <div className="w-[266px]"><Story /></div>],
}

/** A single PersonRow-shaped placeholder. */
export const SingleRow: Story = {
  render: () => (
    <div className="w-[266px]">
      <SkeletonRow barWidth={140} />
    </div>
  ),
}

/** Conversation-area placeholder (message cards with varied line widths). */
export const ConversationList: Story = {
  render: () => (
    <div className="w-[658px]">
      <SkeletonConversationList />
    </div>
  ),
}

/** The raw building block — size it per use. */
export const Bar: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-[266px]">
      <SkeletonBar className="h-3.5 w-40" />
      <SkeletonBar className="h-3 w-24" />
      <SkeletonBar className="w-6 h-6" />
    </div>
  ),
}
