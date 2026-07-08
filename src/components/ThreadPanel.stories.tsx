import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { PeekDataProvider } from '@/api'
import { REPLIES } from '@/api/fixtures'
import type { ConversationData } from '@/api'
import { ThreadPanel } from './ThreadPanel'

const conversation: ConversationData = {
  id: 't1_c1',
  authorName: 'Juan Foley',
  timestamp: '9:14 AM',
  body: "Hey everyone, our CI/CD pipeline has been failing at the build stage since this morning. Logs show it can't resolve some dependencies during the Docker image build step.",
}

const replies = REPLIES['t1_c1']

const meta = {
  title: 'Messages/ThreadPanel',
  component: ThreadPanel,
  parameters: { layout: 'fullscreen' },
  decorators: [
    Story => (
      <MemoryRouter>
        <PeekDataProvider>
          <div className="h-[620px] w-[380px] border border-border-subtle bg-bg-surface">
            <Story />
          </div>
        </PeekDataProvider>
      </MemoryRouter>
    ),
  ],
  args: {
    conversation,
    replies,
    sentReplies: [],
    onClose: () => {},
    onSendReply: () => {},
  },
  argTypes: {
    conversation: { control: false },
    replies: { control: false },
    sentReplies: { control: false },
  },
} satisfies Meta<typeof ThreadPanel>

export default meta
type Story = StoryObj<typeof meta>

/** The thread panel: the pinned original message, a "Replies" divider, the reply cards, and a reply composer. */
export const Default: Story = {}

/** Resolved conversation — the header shows a green "Resolved". */
export const Resolved: Story = {
  args: { isResolved: true },
}

/** Huddle thread — lock icon + member pill in the header. */
export const Huddle: Story = {
  args: {
    huddleMembers: ['You', 'Daniel Stanton', 'Juan Foley'],
    huddleMemberCount: 3,
  },
}
