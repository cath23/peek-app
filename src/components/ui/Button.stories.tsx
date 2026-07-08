import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconPlus } from '@tabler/icons-react'
import { Button } from './Button'

const meta = {
  title: 'Primitives/Button',
  component: Button,
  args: {
    children: 'Button',
    variant: 'muted',
    size: 'default',
    disabled: false,
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'outlined', 'muted'] },
    size: { control: 'inline-radio', options: ['default', 'small'] },
    leadingIcon: { control: false },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: { variant: 'primary' },
}

export const Outlined: Story = {
  args: { variant: 'outlined' },
}

export const Muted: Story = {
  args: { variant: 'muted' },
}

export const Small: Story = {
  args: { variant: 'primary', size: 'small' },
}

export const WithLeadingIcon: Story = {
  args: { variant: 'primary', leadingIcon: <IconPlus className="size-4" /> },
}

export const Disabled: Story = {
  args: { variant: 'primary', disabled: true },
}

/** Every variant × size × icon × disabled combination on one canvas. */
export const AllVariants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-4">
      {(['primary', 'outlined', 'muted'] as const).map(variant => (
        <div key={variant} className="flex items-center gap-3">
          {(['default', 'small'] as const).map(size => (
            <div key={size} className="flex items-center gap-2">
              <Button variant={variant} size={size}>
                Button
              </Button>
              <Button variant={variant} size={size} leadingIcon={<IconPlus className={size === 'small' ? 'size-3.5' : 'size-4'} />}>
                Button
              </Button>
              <Button variant={variant} size={size} disabled>
                Button
              </Button>
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
}
