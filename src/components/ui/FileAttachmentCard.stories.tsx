import type { Meta, StoryObj } from '@storybook/react-vite'
import { FileAttachmentCard } from './FileAttachmentCard'
import sampleVideo from '@/assets/sample-video.mp4'
import sampleImage from '@/assets/highlights icon.png'

const meta = {
  title: 'Messages/FileAttachmentCard',
  component: FileAttachmentCard,
  decorators: [
    Story => (
      <div className="bg-bg-surface p-4 rounded-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FileAttachmentCard>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Video (2026-07-28): first frame as the poster via preload=metadata, play
 * overlay + duration badge; click plays inline with the native controls
 * (scrubber/volume/fullscreen/PiP). A codec the browser can't decode drops
 * the card to the file row with a "Preview unavailable" hint.
 */
export const Video: Story = {
  args: {
    file: {
      storageId: 'story-video',
      url: sampleVideo,
      name: 'screen-recording.mp4',
      contentType: 'video/mp4',
      size: 58_356,
    },
  },
}

/** Images show a cover thumbnail and open a lightbox. */
export const Image: Story = {
  args: {
    file: {
      storageId: 'story-image',
      url: sampleImage,
      name: 'screenshot.png',
      contentType: 'image/png',
      size: 23_980,
    },
  },
}

/** Documents render as a compact icon row; the body opens, the button downloads. */
export const Document: Story = {
  args: {
    file: {
      storageId: 'story-doc',
      url: '#',
      name: 'payment-flow-spec.pdf',
      contentType: 'application/pdf',
      size: 1_240_000,
    },
  },
}

/** Optimistic window — uploaded but no storage URL yet (dimmed, no actions). */
export const Uploading: Story = {
  args: {
    file: {
      storageId: 'story-uploading',
      name: 'retro-notes.docx',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 88_400,
    },
  },
}
