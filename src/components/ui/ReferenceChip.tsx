import { matchReference } from '@/lib/textParsing'
import linearIcon from '@/assets/linear icon.svg'
import githubIcon from '@/assets/github icon.svg'
import zendeskIcon from '@/assets/zendesk icon.svg'

interface ReferenceChipProps {
  /** The matched token, e.g. "PEEK-238", "PR #482", "Zendesk ticket #48821". */
  label: string
}

/** App avatar shown on the chip, per reference kind. Builds point at CI runs,
 *  which live on GitHub. References with no known app render as a plain pill. */
const APP_ICON: Record<string, string | undefined> = {
  linear: linearIcon,
  github: githubIcon,
  build: githubIcon,
  ticket: zendeskIcon,
}

/**
 * Inline clickable reference in read-only message bodies. Same pill treatment
 * as mention tags so it reads as "a reference to something else", plus a
 * pointer cursor + hover underline so it's obviously clickable. References
 * from connected apps carry the app's avatar.
 * Links are inert in the prototype (preventDefault) - the affordance is the design.
 */
export function ReferenceChip({ label }: ReferenceChipProps) {
  const ref = matchReference(label)
  if (!ref) return <>{label}</>

  const iconSrc = APP_ICON[ref.kind]

  return (
    <a
      href={ref.href}
      target="_blank"
      rel="noreferrer"
      data-interactive
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      className="inline-flex items-center gap-1 rounded-sm px-1 mx-0.5 bg-bg-active text-text-primary text-sm font-normal cursor-pointer hover:underline underline-offset-2 decoration-text-secondary"
      style={{ verticalAlign: 'text-bottom', height: '1.4em' }}
    >
      {iconSrc && (
        <img src={iconSrc} width={14} height={14} alt={ref.kind} className="rounded-[2px] shrink-0" />
      )}
      <span>{label}</span>
    </a>
  )
}
