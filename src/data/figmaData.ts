/**
 * Mock Figma structure: File › Page › Frame. Drives the command launcher's
 * find-a-frame flow, composer attachments, and message attachment previews.
 */

export type FrameKind = 'mobile' | 'desktop'

export type FrameArtVariant =
  | 'error'
  | 'error-first-launch'
  | 'guidance-a'
  | 'guidance-b'
  | 'welcome'
  | 'account-setup'
  | 'export-loading'
  | 'download-ready'

export interface FigmaFrame {
  id: string
  name: string
  /** Figma file the frame lives in. */
  file: string
  /** Page within the file - shown as the breadcrumb "File › Page". */
  page: string
  kind: FrameKind
  art: FrameArtVariant
  /** Extra terms for intent-style search ("onboarding screens"). */
  keywords: string[]
}

export const FIGMA_FRAMES: FigmaFrame[] = [
  {
    id: 'fg-frame-1',
    name: 'Error state - returning user',
    file: 'Onboarding v2',
    page: 'Error flows',
    kind: 'mobile',
    art: 'error',
    keywords: ['onboarding', 'screen', 'screens', 'mobile', 'error', 'retry', 'try again', 'face scan', 'liveness'],
  },
  {
    id: 'fg-frame-2',
    name: 'Error state - first launch',
    file: 'Onboarding v2',
    page: 'Error flows',
    kind: 'mobile',
    art: 'error-first-launch',
    keywords: ['onboarding', 'screen', 'screens', 'mobile', 'error', 'empty'],
  },
  {
    id: 'fg-frame-3',
    name: 'Guidance screen - Option A',
    file: 'Onboarding v2',
    page: 'Guidance',
    kind: 'mobile',
    art: 'guidance-a',
    keywords: ['onboarding', 'screen', 'screens', 'mobile', 'illustration', 'static', 'guidance', 'face', 'scan', 'guidelines', 'liveness', 'steps'],
  },
  {
    id: 'fg-frame-4',
    name: 'Guidance screen - Option B',
    file: 'Onboarding v2',
    page: 'Guidance',
    kind: 'mobile',
    art: 'guidance-b',
    keywords: ['onboarding', 'screen', 'screens', 'mobile', 'animation', 'looping', 'guidance', 'face', 'scan', 'guidelines', 'liveness'],
  },
  {
    id: 'fg-frame-5',
    name: 'Welcome screen',
    file: 'Onboarding v2',
    page: 'Welcome',
    kind: 'mobile',
    art: 'welcome',
    keywords: ['onboarding', 'screen', 'screens', 'mobile', 'welcome', 'start'],
  },
  {
    id: 'fg-frame-6',
    name: 'Account setup',
    file: 'Onboarding v2',
    page: 'Welcome',
    kind: 'mobile',
    art: 'account-setup',
    keywords: ['onboarding', 'screen', 'screens', 'mobile', 'account', 'signup', 'form'],
  },
  {
    id: 'fg-frame-7',
    name: 'Export loading state',
    file: 'Dashboard redesign',
    page: 'Exports',
    kind: 'desktop',
    art: 'export-loading',
    keywords: ['dashboard', 'export', 'loading', 'job queue', 'desktop'],
  },
  {
    id: 'fg-frame-8',
    name: 'Download-ready notification',
    file: 'Dashboard redesign',
    page: 'Exports',
    kind: 'desktop',
    art: 'download-ready',
    keywords: ['dashboard', 'export', 'download', 'notification', 'toast', 'desktop'],
  },
]

export function frameById(id: string): FigmaFrame | undefined {
  return FIGMA_FRAMES.find((f) => f.id === id)
}

export function frameBreadcrumb(frame: FigmaFrame): string {
  return `${frame.file} › ${frame.page}`
}

/** Intent-style search: every whitespace-separated token must match somewhere
 *  in the frame's name, file, page, or keywords. Empty query returns all. */
export function searchFigmaFrames(query: string): FigmaFrame[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return FIGMA_FRAMES
  return FIGMA_FRAMES.filter((f) => {
    const hay = [f.name, f.file, f.page, ...f.keywords].join(' ').toLowerCase()
    return tokens.every((t) => hay.includes(t))
  })
}
