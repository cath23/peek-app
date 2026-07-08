import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

/**
 * Loading placeholders (Figma: "Loading & Empty States" page, Skeleton set).
 * Shapes are bg-inset with the small radius; wrap a group in
 * `animate-skeleton-in` (see SkeletonSidebarList) so skeletons only appear
 * after a 150ms delay — fast loads never flash one.
 */
export function SkeletonBar({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cn('bg-bg-inset rounded-sm animate-pulse', className)} style={style} />
}

/** Varied text-bar widths so lists read as content, not stripes. */
const ROW_BAR_WIDTHS = [150, 100, 170, 120, 90, 140, 110, 160]

/** Sidebar list-row placeholder — mirrors PersonRow (h-32, px-2, gap-2, 16px icon). */
export function SkeletonRow({ barWidth = 130 }: { barWidth?: number }) {
  return (
    <div className="flex items-center gap-2 px-2 h-[32px] rounded-lg">
      <SkeletonBar className="w-4 h-4 shrink-0" />
      <SkeletonBar className="h-3.5" style={{ width: barWidth }} />
    </div>
  )
}

/** A left-panel list of skeleton rows, revealed only after the 150ms delay. */
export function SkeletonSidebarList({ rows = 8, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-0.5 animate-skeleton-in', className)} aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonRow key={i} barWidth={ROW_BAR_WIDTHS[i % ROW_BAR_WIDTHS.length]} />
      ))}
    </div>
  )
}

/** Message-card placeholder — mirrors ConversationCard collapsed (24px avatar, 2 body lines). */
export function SkeletonConversationCard({ secondLineWidth = 380 }: { secondLineWidth?: number }) {
  return (
    <div className="rounded-lg pt-2 px-2">
      <div className="flex items-center gap-2 w-full">
        <SkeletonBar className="w-6 h-6 shrink-0" />
        <SkeletonBar className="h-3.5 w-[110px]" />
        <SkeletonBar className="h-3 w-10" />
      </div>
      <div className="pl-8 pr-2 pt-2 pb-2 flex flex-col gap-2">
        <SkeletonBar className="h-3.5 w-full" />
        <SkeletonBar className="h-3.5" style={{ width: secondLineWidth }} />
      </div>
    </div>
  )
}

/** Conversation-area placeholder: a few cards, revealed after the delay. */
export function SkeletonConversationList({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2 animate-skeleton-in', className)} aria-hidden>
      <SkeletonConversationCard secondLineWidth={420} />
      <SkeletonConversationCard secondLineWidth={300} />
      <SkeletonConversationCard secondLineWidth={500} />
    </div>
  )
}

/** Huddle-card placeholder — mirrors HuddleCard grid (h-130, p-2, member avatars, 2 caption lines). */
export function SkeletonHuddleCard() {
  return (
    <div className="flex flex-col h-[130px] rounded-lg border border-border-subtle bg-bg-surface p-2">
      <div className="flex items-center gap-2 w-full">
        <div className="flex">
          <SkeletonBar className="w-6 h-6 shrink-0" />
          <SkeletonBar className="w-6 h-6 shrink-0 -ml-2" />
        </div>
        <SkeletonBar className="h-3.5 flex-1" />
        <SkeletonBar className="h-3 w-8" />
      </div>
      <div className="pt-2 flex flex-col gap-1.5">
        <SkeletonBar className="h-3 w-full" />
        <SkeletonBar className="h-3 w-[70%]" />
      </div>
    </div>
  )
}

/** Huddles-tab grid placeholder (2×2), revealed after the delay. */
export function SkeletonHuddleGrid({ className }: { className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 animate-skeleton-in', className)} aria-hidden>
      <SkeletonHuddleCard />
      <SkeletonHuddleCard />
      <SkeletonHuddleCard />
      <SkeletonHuddleCard />
    </div>
  )
}
