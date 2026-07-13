import type { Meta, StoryObj } from '@storybook/react-vite'
import { PeekApp } from '../PeekApp'

const meta = {
  title: 'Flows/Create topic from a DM',
  component: PeekApp,
  parameters: {
    layout: 'fullscreen',
    // The whole app (h-screen) — iframe it on the Docs page.
    docs: { story: { inline: false, height: '720px' } },
  },
  args: { route: '/people/1' },
  argTypes: { route: { control: false } },
} satisfies Meta<typeof PeekApp>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The real app, opened on a DM. **Try it:** hover a message and open its
 * **⋯** menu → **Start topic** (the start-topic affordance), give the topic a
 * title, and confirm. The DM promotes to a **private huddle inside the new
 * public topic** — the app navigates to that topic and a "Topic created" toast
 * offers *Back to conversation*. Returning to the DM shows the promotion
 * divider in the thread. All of it runs through the real `createTopicFromDm`
 * seam action — no story-only plumbing.
 */
export const Default: Story = {}
