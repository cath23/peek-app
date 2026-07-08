import type { Meta, StoryObj } from '@storybook/react-vite'
import { PEOPLE } from '@/api'
import { CreateTopicDialog } from './CreateTopicDialog'

const meta = {
  title: 'Topics/CreateTopicDialog',
  component: CreateTopicDialog,
  parameters: {
    layout: 'fullscreen',
    // Portals a fixed overlay to document.body — iframe it in Docs.
    docs: { story: { inline: false, height: '500px' } },
  },
  args: {
    onConfirm: () => {},
    onCancel: () => {},
  },
} satisfies Meta<typeof CreateTopicDialog>

export default meta
type Story = StoryObj<typeof meta>

/** Empty — the confirm button stays disabled until a title is entered. */
export const Default: Story = {}

/** Pre-filled title + invitees — confirm enabled. */
export const Prefilled: Story = {
  args: {
    defaultTitle: 'Async export performance',
    defaultInvitees: [PEOPLE[0], PEOPLE[2]],
  },
}

/**
 * Started from a DM: the warning-bordered privacy banner explains the DM becomes a
 * private huddle inside the new (public) topic.
 */
export const FromDm: Story = {
  args: {
    defaultInvitees: [PEOPLE[0]],
    dmContext: { participants: [PEOPLE[0]] },
  },
}
