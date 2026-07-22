import type { Meta, StoryObj } from '@storybook/react-vite'
import { PeekDataProvider } from '@/api'
import { MembersDialog } from './MembersDialog'

const meta = {
  title: 'Topics/MembersDialog',
  component: MembersDialog,
  parameters: { layout: 'fullscreen' },
  decorators: [
    // Roster rows read live profile roles through the seam's Convex context.
    Story => (
      <PeekDataProvider>
        <Story />
      </PeekDataProvider>
    ),
  ],
  args: {
    memberNames: ['You', 'Alice Johnson', 'Jake Walter', 'Zack Bright', 'Amie Miles'],
    onInvite: () => {},
    onClose: () => {},
  },
  argTypes: {
    memberNames: { control: false },
  },
} satisfies Meta<typeof MembersDialog>

export default meta
type Story = StoryObj<typeof meta>

/** Opened from the members pill: the roster with the "Add members" row on top
 *  (the viewer is a member). Clicking it slides to the add layer. */
export const Roster: Story = {
  args: { canAdd: true },
}

/** As a non-member: read-only roster — the add affordance lives behind the
 *  Join banner instead (capability rule). */
export const RosterNonMember: Story = {}

/** The add layer (also where the empty-topic banner lands directly): back
 *  arrow returns to the roster; suggestions appear only once you type. */
export const AddLayer: Story = {
  args: { canAdd: true, initialView: 'add' },
}
