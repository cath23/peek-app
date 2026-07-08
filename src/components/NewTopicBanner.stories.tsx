import type { Meta, StoryObj } from '@storybook/react-vite'
import { NewTopicBanner } from './NewTopicBanner'

const meta = {
  title: 'Components/NewTopicBanner',
  component: NewTopicBanner,
  decorators: [
    Story => (
      <div className="w-[720px] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    topicTitle: 'Feedback on mobile onboarding flow',
    onInviteMembers: () => {},
  },
} satisfies Meta<typeof NewTopicBanner>

export default meta
type Story = StoryObj<typeof meta>

/** Shown at the top of a freshly-promoted topic that has no public conversations yet. */
export const Default: Story = {}

/** Long titles truncate; the Invite-members action stays pinned to the right. */
export const LongTitle: Story = {
  args: { topicTitle: 'Usability test results for the dashboard redesign and the follow-up actions' },
}
