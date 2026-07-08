import type { Meta, StoryObj } from '@storybook/react-vite'
import { SearchInput } from './SearchInput'

const meta = {
  title: 'Inputs/SearchInput',
  component: SearchInput,
  render: args => (
    <div className="w-72">
      <SearchInput {...args} />
    </div>
  ),
} satisfies Meta<typeof SearchInput>

export default meta
type Story = StoryObj<typeof meta>

/** Default placeholder; focus to see the strong border. */
export const Default: Story = {}

/** With the keyboard-shortcut chip, as in the TopBar. */
export const WithShortcut: Story = {
  args: { shortcut: '⌘K' },
}

export const Filled: Story = {
  args: { defaultValue: 'design tokens' },
}
