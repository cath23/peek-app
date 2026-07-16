import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ScreenerPreviewRow } from '@/api'
import { ScreenerPreviewCardView } from './ScreenerPreviewCard'

/**
 * The Screener hover preview (its presentational view). In the app this is
 * portalled and positioned beside the hovered row by `ScreenerPreviewCard`;
 * here we render the box directly with sample rows. The triggering message
 * sits flush; replies are indented with a left border.
 *
 * (The data-connected `ScreenerPreviewCard` returns `null` in mock mode because
 * previews are Convex-only, so the view is storied on its own.)
 */
const SAMPLE: ScreenerPreviewRow[] = [
  {
    authorName: 'Juan Foley',
    timestamp: '9:14 AM',
    kind: 'message',
    body: "Our CI/CD pipeline has been failing at the build stage since this morning — it can't resolve some dependencies during the Docker image build.",
  },
  {
    authorName: 'Priya Nair',
    timestamp: '9:20 AM',
    kind: 'reply',
    body: 'Looks like the Docker base image moved — pinning it now.',
  },
  {
    authorName: 'You',
    timestamp: '9:22 AM',
    kind: 'reply',
    body: "Thanks — I'll re-run the build once that lands.",
  },
]

const meta = {
  title: 'Screener & Desk/ScreenerPreviewCard',
  component: ScreenerPreviewCardView,
  parameters: { layout: 'centered' },
  args: { isTopicResolved: () => false },
  argTypes: { isTopicResolved: { control: false }, rows: { control: false } },
} satisfies Meta<typeof ScreenerPreviewCardView>

export default meta
type Story = StoryObj<typeof meta>

/** Message + two replies. */
export const Default: Story = { args: { rows: SAMPLE } }

/** Loading — the skeleton shown while the preview query is in flight. */
export const Loading: Story = { args: { rows: undefined } }
