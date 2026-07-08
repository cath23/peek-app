import type { Meta, StoryObj } from '@storybook/react-vite'
import { DialogShell } from './DialogShell'
import { Button } from './Button'
import { Field } from './Field'
import { TextInput } from './TextInput'
import { Textarea } from './Textarea'

const meta = {
  title: 'Primitives/DialogShell',
  component: DialogShell,
  parameters: {
    layout: 'fullscreen',
    // Portals a fixed overlay to document.body — render in an iframe on the
    // Docs page so it doesn't escape over the docs content.
    docs: { story: { inline: false, height: '600px' } },
  },
  argTypes: { children: { control: false }, footer: { control: false } },
  args: { title: 'Dialog title', onClose: () => {} },
} satisfies Meta<typeof DialogShell>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The reusable dialog scaffold. A new dialog is just the header title, a body
 * (fields wrapped in `Field`), and a footer of buttons — the portal, backdrop,
 * card, and chrome all come from `DialogShell`. This is exactly how
 * `ResolveDialog` and `CreateTopicDialog` are built.
 */
export const Default: Story = {
  args: {
    bodyClassName: 'flex flex-col gap-6',
    footer: (
      <>
        <Button variant="muted">Cancel</Button>
        <Button variant="primary">Confirm</Button>
      </>
    ),
    children: (
      <>
        <Field label="Title" required>
          <TextInput placeholder="What's this topic about?" />
        </Field>
        <Field label="Notes">
          <Textarea placeholder="Optional notes..." className="h-[80px]" />
        </Field>
      </>
    ),
  },
}

/** A minimal confirmation dialog — single line of body, two buttons. */
export const Confirmation: Story = {
  args: {
    title: 'Delete topic?',
    footer: (
      <>
        <Button variant="muted">Cancel</Button>
        <Button variant="primary">Delete</Button>
      </>
    ),
    children: (
      <p className="text-body-2 text-text-primary leading-[1.4]">
        This permanently removes the topic and its conversations. This can't be undone.
      </p>
    ),
  },
}
