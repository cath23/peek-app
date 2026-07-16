import type { Meta, StoryObj } from '@storybook/react-vite'
import { within, userEvent } from 'storybook/test'
import { PeekDataProvider } from '@/api'
import { AuthScreen } from './AuthScreen'

/**
 * The unauthenticated surface — sign-in / sign-up as a page-level form column
 * (badge, heading, fields, full-width action). Built on the shared `Field` /
 * `TextInput` / `Button` / `PeekLogoBadge` primitives. Email + password only;
 * the link toggles between modes.
 *
 * `PeekDataProvider` supplies the Convex-Auth context `useAuthActions` needs;
 * submitting is inert here (no deployment), so this is a visual/interaction
 * showcase.
 */
const meta = {
  title: 'Auth/AuthScreen',
  component: AuthScreen,
  parameters: {
    layout: 'fullscreen',
    docs: { story: { inline: false, height: '640px' } },
  },
  decorators: [
    Story => (
      <PeekDataProvider>
        <Story />
      </PeekDataProvider>
    ),
  ],
} satisfies Meta<typeof AuthScreen>

export default meta
type Story = StoryObj<typeof meta>

/** Sign in — email + password. */
export const SignIn: Story = {}

/** Sign up — adds the Full name field. Opened by clicking the mode toggle. */
export const SignUp: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByText('No account? Sign up'))
  },
}
