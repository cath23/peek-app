import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { PEOPLE, PeekDataProvider, type Person } from '@/api'
import { PersonChipInput } from './PersonChipInput'

const meta = {
  title: 'Inputs/PersonChipInput',
  component: PersonChipInput,
  // PersonChipInput reads the directory via usePeople() (a Convex query in
  // the seam), so it needs the provider that supplies ConvexProvider.
  decorators: [
    Story => (
      <PeekDataProvider>
        <Story />
      </PeekDataProvider>
    ),
  ],
  args: {
    value: [],
    onChange: () => {},
  },
  argTypes: {
    value: { control: false },
  },
  render: function Render(args) {
    const [value, setValue] = useState<Person[]>(args.value)
    return (
      <div className="w-96">
        <PersonChipInput {...args} value={value} onChange={setValue} />
      </div>
    )
  },
} satisfies Meta<typeof PersonChipInput>

export default meta
type Story = StoryObj<typeof meta>

/** Click to focus — the suggestion dropdown portals under the field.
 *  Enter adds, Backspace removes the last chip, Escape closes. */
export const Empty: Story = {}

export const WithChips: Story = {
  args: { value: PEOPLE.slice(0, 2) },
}

/** Excluded ids (e.g. the current user) never appear in suggestions. */
export const WithExclusions: Story = {
  args: { excludeIds: PEOPLE.slice(2).map(p => p.id) },
}
