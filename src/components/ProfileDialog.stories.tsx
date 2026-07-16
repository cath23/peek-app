import type { Meta, StoryObj } from '@storybook/react-vite'
import { PeekDataProvider } from '@/api'
import { ProfileDialog } from './ProfileDialog'

/**
 * Edit your own profile — display name, role, and avatar. Built on the shared
 * `DialogShell` / `Field` / `TextInput` primitives. The avatar uploads
 * immediately on pick; name and role save on confirm; email is read-only.
 *
 * In Storybook (mock mode) the current user is the fixture "You" with no
 * avatar, so the form starts populated with that name and shows the upload
 * affordance.
 */
const meta = {
  title: 'Navigation/ProfileDialog',
  component: ProfileDialog,
  parameters: {
    layout: 'fullscreen',
    // Portals a fixed overlay to document.body — iframe it in Docs.
    docs: { story: { inline: false, height: '560px' } },
  },
  decorators: [
    Story => (
      <PeekDataProvider>
        <Story />
      </PeekDataProvider>
    ),
  ],
  args: { onClose: () => {} },
} satisfies Meta<typeof ProfileDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
