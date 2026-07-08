import type { Meta, StoryObj } from '@storybook/react-vite'
import { Toast } from './Toast'

const meta = {
  title: 'UI/Toast',
  component: Toast,
  args: {
    label: 'Topic created',
    type: 'neutral',
    leadingIcon: true,
  },
  argTypes: {
    type: { control: 'inline-radio', options: ['success', 'brand', 'neutral'] },
    onAction: { control: false },
  },
} satisfies Meta<typeof Toast>

export default meta
type Story = StoryObj<typeof meta>

export const Neutral: Story = {}

export const Success: Story = {
  args: { type: 'success', label: 'Marked as resolved' },
}

export const Brand: Story = {
  args: { type: 'brand', label: 'Huddle started' },
}

/** With a right-side action (as used for "View topic" after promoting a DM). */
export const WithAction: Story = {
  args: {
    type: 'neutral',
    label: 'Topic created from conversation',
    actionLabel: 'View topic',
    onAction: () => {},
  },
}

export const NoIcon: Story = {
  args: { leadingIcon: false, label: 'Copied to clipboard' },
}

/** All three surfaces, with and without an action. */
export const AllTypes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col items-start gap-2">
      {(['success', 'brand', 'neutral'] as const).map(type => (
        <div key={type} className="flex items-center gap-2">
          <Toast type={type} label="Marked as resolved" />
          <Toast type={type} label="Marked as resolved" actionLabel="Undo" onAction={() => {}} />
        </div>
      ))}
    </div>
  ),
}
