import type { Meta, StoryObj } from '@storybook/react-vite'
import { TOPICS } from '@/api'
import { APP_FILES, DOCUMENT_FILES } from '@/api'
import { TopicMutationsProvider } from '@/lib/topicMutations'
import { FilesMenu, type FilesMenuItem } from './FilesMenu'

// Build the flat item list exactly as the `[` extension does (mention.tsx).
const ITEMS: FilesMenuItem[] = [
  ...TOPICS.map<FilesMenuItem>((t) => ({ kind: 'topic', data: t })),
  ...APP_FILES.map<FilesMenuItem>((f) => ({ kind: 'app', data: f })),
  ...DOCUMENT_FILES.map<FilesMenuItem>((f) => ({ kind: 'document', data: f })),
]

const meta = {
  title: 'UI/FilesMenu',
  component: FilesMenu,
  decorators: [
    Story => (
      <TopicMutationsProvider>
        <Story />
      </TopicMutationsProvider>
    ),
  ],
  args: {
    items: ITEMS,
    query: '',
    onSelect: () => {},
  },
  argTypes: {
    items: { control: false },
  },
} satisfies Meta<typeof FilesMenu>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Level 1: the three app categories (GitHub / Figma / Linear), then Topics with
 * their live status icon, then Documents. Click an app row (or press Enter / →
 * on it) to drill into that app's files (level 2); ← or Backspace drills back.
 */
export const Default: Story = {}

/**
 * Level 2 preview — drill into Figma by keyboard/mouse from Default. Shown here
 * via a query that narrows to Figma files, surfacing their brand icon + subtitle.
 */
export const AppMatches: Story = {
  args: { query: 'figma' },
}

/**
 * Search mode: typing flattens the two levels into ranked sections
 * (Apps / Topics / Documents), each filtered by the query.
 */
export const Filtered: Story = {
  args: { query: 'onboarding' },
}

/** Document results carry per-type icons (pdf, image, presentation, …). */
export const Documents: Story = {
  args: { query: '2026' },
}
