import type { Meta, StoryObj } from '@storybook/react-vite'
import { ConversationMoreMenu } from './ConversationMoreMenu'

const noop = () => {}

const meta = {
  title: 'Components/ConversationMoreMenu',
  component: ConversationMoreMenu,
  args: {
    isTopic: false,
    isResolved: false,
    showCreateTopic: true,
    isOwnMessage: false,
    onHighlight: noop,
    onCreateTopic: noop,
    onRevertToConversation: noop,
    onResolve: noop,
    onReopen: noop,
    onOpenWork: noop,
    onEditMessage: noop,
    onViewDetails: noop,
    onDelete: noop,
  },
  argTypes: {
    currentHighlight: {
      control: 'select',
      options: [undefined, 'insight', 'concern', 'conclusion', 'question', 'summary'],
    },
  },
} satisfies Meta<typeof ConversationMoreMenu>

export default meta
type Story = StoryObj<typeof meta>

/**
 * A DM message that hasn't seeded a topic yet: Start topic · Resolve · Open work ·
 * Mark as Highlight, then View details. Hover "Mark as Highlight" to open the
 * 5-type submenu.
 */
export const DmMessage: Story = {}

/** A message that already started a topic drops "Start topic". */
export const AlreadySeeded: Story = {
  args: { showCreateTopic: false },
}

/** Inside a topic the top action becomes "Revert to conversation". */
export const TopicMessage: Story = {
  args: { isTopic: true },
}

/** When resolved, "Resolve →" becomes "Reopen". */
export const Resolved: Story = {
  args: { isResolved: true },
}

/** Your own message adds Edit message + a destructive Delete. */
export const OwnMessage: Story = {
  args: { isOwnMessage: true },
}

/** With a highlight set, the row reads "Change highlight" and the submenu gains Remove. */
export const WithHighlight: Story = {
  args: { currentHighlight: 'insight', isOwnMessage: true },
}
