import type { Meta, StoryObj } from '@storybook/react-vite'
import { ReferenceChip } from './ReferenceChip'

const meta = {
  title: 'Messages/ReferenceChip',
  component: ReferenceChip,
  args: {
    label: 'PEEK-238',
  },
} satisfies Meta<typeof ReferenceChip>

export default meta
type Story = StoryObj<typeof meta>

/** Linear issue reference. */
export const LinearIssue: Story = {}

export const GithubPr: Story = {
  args: { label: 'PR #482' },
}

/** Builds point at CI runs, which live on GitHub. */
export const Build: Story = {
  args: { label: 'build #1024' },
}

export const ZendeskTicket: Story = {
  args: { label: 'Zendesk ticket #48821' },
}

/** Unmatched labels render as plain text — no chip. */
export const Unmatched: Story = {
  args: { label: 'not a reference' },
}

/** Chips inline in running text, as they appear in message bodies. */
export const InText: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <p className="max-w-md text-body-1 text-text-primary">
      Fixed in <ReferenceChip label="PR #482" /> which closes <ReferenceChip label="PEEK-238" /> —
      confirmed by <ReferenceChip label="build #1024" /> after the report in{' '}
      <ReferenceChip label="Zendesk ticket #48821" />.
    </p>
  ),
}
