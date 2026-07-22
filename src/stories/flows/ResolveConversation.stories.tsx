import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { PeekDataProvider, useThread, usePeekActions } from '@/api'
import { ConversationCard } from '@/components/ConversationCard'

/**
 * A real seeded conversation card wired to the seam's resolution state
 * (`useThread` → `usePeekActions().setResolution`). The card owns its own
 * quick-menu + `ResolveDialog`, so every resolve path works live:
 *
 * - **Resolve via menu/dialog:** hover the card → **⋯** or the quick-menu
 *   check → **Resolve** → write an outcome → the green resolution banner
 *   appears and persists through the seam.
 * - **Reopen (unresolve):** hover the resolved card → quick-menu → **Reopen**.
 * - **Unresolve by editing:** open the message editor and delete the
 *   resolution block — saving reopens it.
 *
 * (Resolve-via-reply lives in **Flows/Reply in a thread** — a reply carrying a
 * resolution resolves its parent.)
 */
function ResolveConversation({ messageId }: { messageId: string }) {
  const thread = useThread(messageId)
  const actions = usePeekActions()
  const c = thread.conversation

  if (!c) return null

  // Signal theme: the reply row's facepile + last-reply time come straight
  // from the live thread (light/dark ignore these props).
  const allReplies = [...thread.replies, ...thread.sentReplies]
  const replyAuthors = [...new Set(allReplies.map(r => r.authorName))].map(name => ({ name }))
  const lastReplyTime = allReplies[allReplies.length - 1]?.timestamp

  return (
    <ConversationCard
      authorName={c.authorName}
      timestamp={c.timestamp}
      body={c.body}
      reactions={c.reactions}
      replyCount={c.replyCount}
      replyAuthors={replyAuthors}
      lastReplyTime={lastReplyTime}
      isResolved={c.isResolved ?? false}
      resolvedBy={c.resolvedBy ?? ''}
      resolutionMessage={c.resolutionMessage ?? ''}
      onResolvedChange={(resolved, resolvedBy, message) =>
        actions.setResolution(messageId, resolved, resolvedBy, message)
      }
      onBodyChange={(body) => actions.editBody(messageId, body)}
      showCreateTopic={false}
    />
  )
}

const meta = {
  title: 'Flows/Resolve a conversation',
  component: ResolveConversation,
  parameters: { layout: 'padded' },
  decorators: [
    Story => (
      <MemoryRouter>
        <PeekDataProvider>
          <div className="w-[640px] bg-bg-surface rounded-lg p-2">
            <Story />
          </div>
        </PeekDataProvider>
      </MemoryRouter>
    ),
  ],
  args: { messageId: 't1_c1' },
  argTypes: { messageId: { control: false } },
} satisfies Meta<typeof ResolveConversation>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Starts open. Hover the card and use the quick-menu (or **⋯ → Resolve**) to
 * resolve it with an outcome message, then reopen it from the same menu.
 */
export const Default: Story = {}
