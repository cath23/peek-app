import type { Meta, StoryObj } from '@storybook/react-vite'
import { NewTopicBanner } from './NewTopicBanner'

const meta = {
  title: 'Topics/NewTopicBanner',
  component: NewTopicBanner,
  decorators: [
    Story => (
      <div className="w-[720px] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    title: 'Feedback on mobile onboarding flow',
    onInviteMembers: () => {},
  },
} satisfies Meta<typeof NewTopicBanner>

export default meta
type Story = StoryObj<typeof meta>

/** Shown above the composer of any topic that has no public conversations yet. */
export const Default: Story = {}

/** Long titles truncate; the Invite-members action stays pinned to the right. */
export const LongTitle: Story = {
  args: { title: 'Usability test results for the dashboard redesign and the follow-up actions' },
}

/** DM variant: beginning of a conversation with a person — no invite action. */
export const DmBeginning: Story = {
  args: { kind: 'dm', title: 'Amie Wong' },
}
