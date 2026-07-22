import type { FC, ReactNode } from 'react'
import {
  IconCircleCheck,
  IconCircleDashed,
  IconBrandGithub,
  IconFile,
  IconFileTypePdf,
  IconPhoto,
  IconTable,
  IconPresentation,
} from '@tabler/icons-react'
import figmaIcon from '@/assets/figma icon.svg'
import linearIcon from '@/assets/linear icon.svg'
import { TOPICS } from '@/api'
import { APP_FILES, DOCUMENT_FILES } from '@/api'
import { INLINE_TOKEN_RE, matchReference, matchUrl, parseBodySegments } from '@/lib/textParsing'
import { cn } from '@/lib/utils'
import { ReferenceChip } from './ReferenceChip'

// Inline token renderer shared by ConversationCard and ThreadReplyCard: turns
// [Topic]/[File] refs into chips (with live topic status icons), @/!@ mentions
// into pills, and PEEK-/PR#/build# tokens into ReferenceChips.
function renderWithMentions(text: string, isTopicResolved: (id: string) => boolean): ReactNode {
  const parts = text.split(INLINE_TOKEN_RE)
  if (parts.length === 1) return text
  return (
    <>
      {parts.map((part, i) => {
        // A user-typed URL → a real, clickable link. `break-all` lets long
        // URLs wrap instead of forcing the card to overflow horizontally.
        const url = matchUrl(part)
        if (url) {
          return (
            <span key={i}>
              <a
                href={url.href}
                target="_blank"
                rel="noopener noreferrer"
                data-interactive
                className="text-info-default underline underline-offset-2 break-all hover:opacity-80"
                onClick={(e) => e.stopPropagation()}
              >
                {url.href}
              </a>
              {url.trailing}
            </span>
          )
        }
        if (part.startsWith('[') && part.endsWith(']') && part.length > 2) {
          const title = part.slice(1, -1)
          const topic = TOPICS.find((t) => t.title === title)
          if (topic) {
            const resolved = isTopicResolved(topic.id)
            return (
              <span key={i} className="inline-flex items-center gap-1 rounded-sm px-1 mx-0.5 bg-bg-active text-text-primary text-sm font-normal select-none" style={{ verticalAlign: 'text-bottom', height: '1.4em' }}>
                <span className="relative inline-flex items-center justify-center w-4 h-4 shrink-0">
                  {resolved ? (
                    <IconCircleCheck size={16} stroke={1.5} className="text-success-default" />
                  ) : (
                    <IconCircleDashed size={16} stroke={1.5} className="text-text-secondary" />
                  )}
                </span>
                <span>{title}</span>
              </span>
            )
          }
          // App or document file
          const appFile = APP_FILES.find((f) => f.title === title)
          const docFile = DOCUMENT_FILES.find((f) => f.title === title)
          const fileApp = appFile?.app ?? docFile?.docType ?? ''
          const svgIcons: Record<string, string> = { figma: figmaIcon, linear: linearIcon }
          const tablerIcons: Record<string, FC<{ size: number; stroke: number; className?: string }>> = {
            github: IconBrandGithub, pdf: IconFileTypePdf, image: IconPhoto,
            spreadsheet: IconTable, presentation: IconPresentation,
          }
          const svgSrc = svgIcons[fileApp]
          const TablerIcon = tablerIcons[fileApp] ?? IconFile
          return (
            <span key={i} className="inline-flex items-center gap-1 rounded-sm px-1 mx-0.5 bg-bg-active text-text-primary text-sm font-normal select-none" style={{ verticalAlign: 'text-bottom', height: '1.4em' }}>
              {svgSrc ? (
                <img src={svgSrc} width={14} height={14} alt={fileApp} className="rounded-[2px] shrink-0" />
              ) : (
                <span className="flex items-center justify-center w-4 h-4 shrink-0 text-text-secondary">
                  <TablerIcon size={14} stroke={1.5} />
                </span>
              )}
              <span>{title}</span>
            </span>
          )
        }
        if (/^(?:!@|@)/.test(part) && part.length > 1) {
          // Same treatment the composer gives the tag while typing: urgent
          // mentions wear the warning colors, plain mentions the accent.
          const urgent = part.startsWith('!@')
          return (
            <span
              key={i}
              className={cn(
                'rounded-sm px-1 mx-0.5 text-sm font-normal select-none',
                urgent ? 'bg-warning-muted text-warning-default' : 'bg-accent-muted text-accent-primary'
              )}
            >
              {part}
            </span>
          )
        }
        if (matchReference(part)) {
          return <ReferenceChip key={i} label={part} />
        }
        return part || null
      })}
    </>
  )
}

export function MessageBody({ body, isTopicResolved }: { body: string; isTopicResolved: (id: string) => boolean }) {
  const segments = parseBodySegments(body)
  return (
    <div data-message-body className="flex flex-col gap-1 text-sm text-text-secondary leading-[1.4] break-words">
      {segments.map((seg, i) => {
        if (seg.type === 'bullet') {
          return (
            <ul key={i} className="flex flex-col gap-1">
              {seg.items.map((item, j) => (
                <li key={j} className="flex gap-2">
                  <span className="shrink-0 mt-px">•</span>
                  <span className="min-w-0 break-words">{renderWithMentions(item, isTopicResolved)}</span>
                </li>
              ))}
            </ul>
          )
        }
        if (seg.type === 'numbered') {
          return (
            <ol key={i} className="flex flex-col gap-1">
              {seg.items.map((item, j) => (
                <li key={j} className="flex gap-2">
                  <span className="shrink-0 text-text-muted">{j + 1}.</span>
                  <span className="min-w-0 break-words">{renderWithMentions(item, isTopicResolved)}</span>
                </li>
              ))}
            </ol>
          )
        }
        return (
          <p key={i}>
            {seg.lines.map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {renderWithMentions(line, isTopicResolved)}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}
