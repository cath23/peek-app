import { FIGMA_FRAMES } from './figmaData'
import { LINEAR_ISSUES } from './linearData'

export type FileCategory = 'topic' | 'app' | 'document'

export interface AppFile {
  id: string
  category: 'app'
  app: 'github' | 'figma' | 'linear'
  appLabel: string
  title: string
  subtitle?: string
}

export interface DocumentFile {
  id: string
  category: 'document'
  docType: 'pdf' | 'image' | 'spreadsheet' | 'presentation' | 'generic'
  title: string
  subtitle?: string
}

export type FileItem = AppFile | DocumentFile

export interface AppCategory {
  app: AppFile['app']
  label: string
  description: string
}

export const APP_CATEGORIES: AppCategory[] = [
  { app: 'github', label: 'GitHub', description: 'Pull requests & issues' },
  { app: 'figma', label: 'Figma', description: 'Files & frames' },
  { app: 'linear', label: 'Linear', description: 'Issues & projects' },
]

export const APP_FILES: AppFile[] = [
  // GitHub
  { id: 'gh-1', category: 'app', app: 'github', appLabel: 'GitHub', title: 'Fix auth middleware regression', subtitle: 'PR #1234 · peek-app' },
  { id: 'gh-2', category: 'app', app: 'github', appLabel: 'GitHub', title: 'Add rate limiting to API endpoints', subtitle: 'PR #1201 · peek-api' },
  { id: 'gh-3', category: 'app', app: 'github', appLabel: 'GitHub', title: 'Mobile navigation not dismissing on tap outside', subtitle: 'Issue #892 · peek-mobile' },
  { id: 'gh-4', category: 'app', app: 'github', appLabel: 'GitHub', title: 'Upgrade to React 19', subtitle: 'PR #1245 · peek-app' },
  { id: 'gh-5', category: 'app', app: 'github', appLabel: 'GitHub', title: 'Database connection pool exhaustion in prod', subtitle: 'Issue #901 · peek-api' },
  { id: 'gh-6', category: 'app', app: 'github', appLabel: 'GitHub', title: 'Add WebSocket reconnection logic', subtitle: 'PR #1250 · peek-app' },
  // Figma
  { id: 'fg-1', category: 'app', app: 'figma', appLabel: 'Figma', title: 'Compose box redesign', subtitle: 'Peek App v2 · Components' },
  { id: 'fg-2', category: 'app', app: 'figma', appLabel: 'Figma', title: 'Onboarding flow screens', subtitle: 'Peek Mobile · Flows' },
  { id: 'fg-3', category: 'app', app: 'figma', appLabel: 'Figma', title: 'Navigation rail v3', subtitle: 'Peek App v2 · Components' },
  { id: 'fg-4', category: 'app', app: 'figma', appLabel: 'Figma', title: 'Settings page wireframes', subtitle: 'Peek App v2 · Pages' },
  { id: 'fg-5', category: 'app', app: 'figma', appLabel: 'Figma', title: 'Brand illustration set', subtitle: 'Peek Brand · Assets' },
  // Figma frames (from figmaData.ts) - being in APP_FILES makes their [titles]
  // re-parse into chips after a message is sent and lists them in the [ menu.
  ...FIGMA_FRAMES.map<AppFile>((f) => ({
    id: f.id,
    category: 'app',
    app: 'figma',
    appLabel: 'Figma',
    title: f.name,
    subtitle: `Frame · ${f.file} › ${f.page}`,
  })),
  // Linear
  { id: 'ln-1', category: 'app', app: 'linear', appLabel: 'Linear', title: 'Implement push notification grouping', subtitle: 'ENG-4521 · Sprint 23' },
  { id: 'ln-2', category: 'app', app: 'linear', appLabel: 'Linear', title: 'Investigate slow query on dashboard load', subtitle: 'ENG-4498 · Backlog' },
  { id: 'ln-3', category: 'app', app: 'linear', appLabel: 'Linear', title: 'File upload size limit increase', subtitle: 'ENG-4530 · Sprint 23' },
  { id: 'ln-4', category: 'app', app: 'linear', appLabel: 'Linear', title: 'Dark mode color token audit', subtitle: 'DES-312 · Sprint 24' },
  { id: 'ln-5', category: 'app', app: 'linear', appLabel: 'Linear', title: 'Migrate cron jobs to new scheduler', subtitle: 'ENG-4545 · Backlog' },
  // Linear issues (from linearData.ts) - titled by key so an inserted
  // [PEEK-142] chip re-parses after send, and they're referenceable via [.
  ...LINEAR_ISSUES.map<AppFile>((i) => ({
    id: `linear-${i.key}`,
    category: 'app',
    app: 'linear',
    appLabel: 'Linear',
    title: i.key,
    subtitle: `${i.title} · ${i.status}`,
  })),
]

export const DOCUMENT_FILES: DocumentFile[] = [
  { id: 'doc-1', category: 'document', docType: 'pdf', title: 'Brand guidelines 2026.pdf', subtitle: '2.4 MB' },
  { id: 'doc-2', category: 'document', docType: 'image', title: 'Screenshot 2026-03-28.png', subtitle: '840 KB' },
  { id: 'doc-3', category: 'document', docType: 'spreadsheet', title: 'Q1 metrics export.xlsx', subtitle: '1.1 MB' },
  { id: 'doc-4', category: 'document', docType: 'presentation', title: 'Board deck Q1 2026.pptx', subtitle: '8.3 MB' },
  { id: 'doc-5', category: 'document', docType: 'generic', title: 'Meeting notes - March standup.txt', subtitle: '12 KB' },
]
