import type { Meta, StoryObj } from '@storybook/react-vite'
import { MessageBody } from './MessageBody'

const meta = {
  title: 'Messages/MessageBody',
  component: MessageBody,
  args: {
    // MessageBody takes the resolved-lookup from its caller (useTopicMutations);
    // the story supplies a stub so [Topic] chips can be shown resolved/unresolved.
    isTopicResolved: (): boolean => false,
  },
  argTypes: {
    isTopicResolved: { control: false },
  },
  decorators: [
    Story => (
      <div className="w-[480px] bg-bg-surface p-3 rounded-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MessageBody>

export default meta
type Story = StoryObj<typeof meta>

/** Plain prose — a blank line splits the run into two paragraph segments. */
export const Paragraph: Story = {
  args: {
    body:
      "Found the root cause: the identity-verification service was returning 503s during morning peak hours.\n\nPinning the dependency back and re-running the build now — will confirm once it's green.",
  },
}

/** Lines beginning with `- ` (or `• `) render as a bullet list. */
export const BulletList: Story = {
  args: {
    body: 'Two options on the table:\n- Job queue with a download link\n- Pagination on the export endpoint',
  },
}

/** Lines beginning with `1. ` render as a numbered list. */
export const NumberedList: Story = {
  args: {
    body: 'Rollout plan:\n1. Ship the backoff fix to staging\n2. Verify no 429 loops for 24h\n3. Promote to production',
  },
}

/**
 * Inline chips: `@`/`!@` mentions, a `[Topic]` ref (live status icon), a `[File]`
 * ref (app icon), and auto-linked external references (PR, PEEK, build, ticket).
 */
export const InlineTokens: Story = {
  args: {
    body:
      'Pinging @Daniel Stanton and !@Alice Johnson — this ties into [Ongoing onboarding issues] and the new [Onboarding flow screens]. Fix is in PR #1234, tracked as PEEK-142; verify against build #5102 and Zendesk ticket #48821.',
  },
}

/** The same `[Topic]` chip when the topic is resolved — dashed circle → green check. */
export const ResolvedTopicChip: Story = {
  args: {
    body: 'Closing out [Ongoing onboarding issues] now — outcome captured in the resolution above.',
    isTopicResolved: () => true,
  },
}
