import type { Meta, StoryObj } from '@storybook/react-vite'
import { Divider } from './Divider'

const meta = {
  title: 'UI/Divider',
  component: Divider,
} satisfies Meta<typeof Divider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="w-80 bg-bg-surface rounded-lg border border-border-default py-3">
      <p className="px-3 pb-2 text-body-2 text-text-primary">Above the divider</p>
      <Divider />
      <p className="px-3 pt-2 text-body-2 text-text-primary">Below the divider</p>
    </div>
  ),
}
