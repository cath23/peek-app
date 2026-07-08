import type { Meta, StoryObj } from '@storybook/react-vite'
import { ResolveDialog } from './ResolveDialog'

const meta = {
  title: 'Components/ResolveDialog',
  component: ResolveDialog,
  parameters: { layout: 'fullscreen' },
  args: {
    onResolve: () => {},
    onCancel: () => {},
  },
} satisfies Meta<typeof ResolveDialog>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Resolve a conversation with an optional outcome message. The textarea starts empty;
 * type an outcome (or leave it blank to resolve with no message).
 */
export const Default: Story = {}
