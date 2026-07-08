/**
 * Mock Linear issues. Drives the @linear / launcher find-an-issue flow.
 * Keys use the PEEK- prefix so inserted references auto-link via the
 * existing INLINE_TOKEN_RE reference-chip parsing.
 */

export type LinearStatus = 'Todo' | 'In Progress' | 'Done'

export interface LinearIssue {
  key: string
  title: string
  status: LinearStatus
  assignee: string
  description: string
  /** Extra terms for intent-style search ("sdk upgrade"). */
  keywords: string[]
}

export const LINEAR_ISSUES: LinearIssue[] = [
  {
    key: 'PEEK-142',
    title: 'Upgrade liveness SDK to 3.4.2',
    status: 'In Progress',
    assignee: 'Zack Bright',
    description:
      'Replace SDK 3.1.0 with 3.4.2 for the face scan step: better low-light detection, real-time positioning feedback, cleaner error states. Quick win ahead of the full UX rework.',
    keywords: ['sdk', 'upgrade', 'liveness', 'face scan', 'onboarding', '3.4.2'],
  },
  {
    key: 'PEEK-138',
    title: 'Rewrite face scan error copy for non-technical users',
    status: 'Todo',
    assignee: 'Alice Johnson',
    description:
      'Current error messages are too technical and push users to abandon after failed attempts. Rewrite all liveness-check error states in plain language.',
    keywords: ['error', 'copy', 'face scan', 'liveness', 'onboarding', 'ux'],
  },
  {
    key: 'PEEK-131',
    title: 'Job queue for exports over 10k rows',
    status: 'In Progress',
    assignee: 'Daniel Stanton',
    description:
      'Synchronous export generation times out on large datasets. Move exports to a background job queue with a download-ready notification.',
    keywords: ['export', 'job queue', 'dashboard', 'timeout', 'download'],
  },
  {
    key: 'PEEK-129',
    title: "Add 'Try again' shortcut on the error screen",
    status: 'Todo',
    assignee: 'Daniel Stanton',
    description:
      'The onboarding error screen currently routes users back to the start of the flow. Add a direct retry shortcut to recover drop-offs cheaply.',
    keywords: ['error', 'retry', 'try again', 'onboarding', 'shortcut'],
  },
  {
    key: 'PEEK-115',
    title: 'Investigate onboarding drop-off spike',
    status: 'Done',
    assignee: 'Greg Bothman',
    description:
      'Drop-off rate up 34% in two weeks. Funnel analysis traced it to the liveness check step (41% non-completion). See topic: Ongoing onboarding issues.',
    keywords: ['onboarding', 'drop-off', 'funnel', 'investigation', 'liveness'],
  },
]

export function linearIssueByKey(key: string): LinearIssue | undefined {
  return LINEAR_ISSUES.find((i) => i.key === key)
}

/** Intent-style search: every token must match key/title/status/assignee/keywords. */
export function searchLinearIssues(query: string): LinearIssue[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return LINEAR_ISSUES
  return LINEAR_ISSUES.filter((i) => {
    const hay = [i.key, i.title, i.status, i.assignee, ...i.keywords].join(' ').toLowerCase()
    return tokens.every((t) => hay.includes(t))
  })
}
