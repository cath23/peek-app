import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { PeekDataProvider, useThread, usePeekActions } from '@/api'
import { ThreadPanel } from '@/components/ThreadPanel'

/**
 * A live thread of a real seeded conversation, wired to the seam's real read
 * (`useThread`) and write (`usePeekActions().sendReply`) — the exact wiring the
 * app uses. Type a reply in the composer and send: it appends as a "You" reply,
 * scrolls into view, and the parent reply-count updates. No mock plumbing.
 */
function ReplyInThread({ messageId }: { messageId: string }) {
  const thread = useThread(messageId)
  const actions = usePeekActions()

  if (!thread.conversation) return null

  return (
    <ThreadPanel
      conversation={thread.conversation}
      replies={thread.replies}
      sentReplies={thread.sentReplies}
      resolvedByReplyId={thread.resolvedByReplyId}
      resolutionMsg={thread.resolutionMessage}
      onSendReply={(payload) => actions.sendReply(messageId, payload)}
      onClose={() => {}}
    />
  )
}

const meta = {
  title: 'Flows/Reply in a thread',
  component: ReplyInThread,
  parameters: { layout: 'centered' },
  decorators: [
    Story => (
      <MemoryRouter>
        <PeekDataProvider>
          <div className="h-[640px] w-[380px] border border-border-subtle bg-bg-surface rounded-lg overflow-hidden">
            <Story />
          </div>
        </PeekDataProvider>
      </MemoryRouter>
    ),
  ],
  args: { messageId: 't1_c1' },
  argTypes: { messageId: { control: false } },
} satisfies Meta<typeof ReplyInThread>

export default meta
type Story = StoryObj<typeof meta>

/**
 * **Try it:** click into the composer at the bottom, type a reply, and press
 * Enter (or **Send**). Your reply appears at the end of the thread as "You".
 */
export const Default: Story = {}
