import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconArrowUp, IconMessage2 } from '@tabler/icons-react'
import { Chip } from './Chip'

const meta = {
  title: 'UI/Chip',
  component: Chip,
  args: {
    type: 'neutral',
    label: 'Label',
  },
  argTypes: {
    type: {
      control: 'inline-radio',
      options: ['neutral', 'brand', 'info', 'warning', 'success', 'error'],
    },
    leadingIcon: { control: false },
    trailingIcon: { control: false },
  },
} satisfies Meta<typeof Chip>

export default meta
type Story = StoryObj<typeof meta>

export const Neutral: Story = {}

/** The "1 new" reply chip as used on ConversationCard (brand = read pace, warning = urgent). */
export const NewReply: Story = {
  args: { type: 'brand', label: '1 new' },
}

export const WithLeadingIcon: Story = {
  args: { type: 'info', label: 'Replies', leadingIcon: <IconMessage2 className="size-3" stroke={1.5} /> },
}

export const WithTrailingIcon: Story = {
  args: { type: 'success', label: 'Sorted', trailingIcon: <IconArrowUp className="size-3" stroke={1.5} /> },
}

/** Count-only chip, as used for the Screener item count. */
export const CountOnly: Story = {
  args: { type: 'neutral', label: '2' },
}

/** All six color types. */
export const AllTypes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-2">
      {(['neutral', 'brand', 'info', 'warning', 'success', 'error'] as const).map(type => (
        <Chip key={type} type={type} label={type} />
      ))}
    </div>
  ),
}
