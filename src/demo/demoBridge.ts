/**
 * Demo bridge — how the scenario player drives the embedded app.
 *
 * Installed only in demo mode (see ./demoMode), from main.tsx. The player
 * (demo-scenarios/) embeds this app twice: one frame is the app itself, one is
 * clipped down to just the highlights card so the card can be presented alone
 * on screen before the app arrives around it. `?frame=app|card` names which,
 * and every message carries it back so the player can tell them apart.
 *
 * The player needs three things from a frame:
 *
 *   1. geometry — where the card sits, collapsed and expanded. Measured up
 *      front on `calibrate`, because a timeline that awaits something mid-run
 *      can't be scrubbed backwards.
 *   2. state — expand/collapse the card, and hide it entirely (the topic has
 *      to look empty while the card is still flying in).
 *   3. it does all of this against the real DOM: it clicks the card's own
 *      Expand button and measures the real element, so what gets filmed is
 *      the real component reacting, and nothing is pinned to a layout.
 *
 * Messages are plain JSON over postMessage (the player is a different origin
 * — its own dev server), all tagged `peek-demo`.
 */

const TAG = 'peek-demo'

/** Which of the player's two embeds this is. */
const FRAME =
  typeof window === 'undefined'
    ? 'app'
    : (new URLSearchParams(window.location.search).get('frame') ?? 'app')

interface CardRect {
  x: number
  y: number
  width: number
  height: number
}

/** Player → app. */
type Command =
  | { source: typeof TAG; type: 'calibrate' }
  | { source: typeof TAG; type: 'measure' }
  | { source: typeof TAG; type: 'set-expanded'; expanded: boolean }
  | { source: typeof TAG; type: 'set-card-visible'; visible: boolean }
  | { source: typeof TAG; type: 'set-reply-visible'; visible: boolean }

function card(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-highlights-card]')
}

function toggleButton(): HTMLButtonElement | null {
  return card()?.querySelector<HTMLButtonElement>('[data-highlights-toggle]') ?? null
}

function isExpanded(): boolean {
  return toggleButton()?.textContent?.trim() === 'Minimize'
}

function post(type: string, payload?: Record<string, unknown>) {
  window.parent?.postMessage({ source: TAG, frame: FRAME, type, ...payload }, '*')
}

function rect(): CardRect | null {
  const el = card()
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.x, y: r.y, width: r.width, height: r.height }
}

const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)))
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** The stream this card lives in, if it scrolls. */
function scroller(): HTMLElement | null {
  let el = card()?.parentElement ?? null
  while (el) {
    const style = getComputedStyle(el)
    if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight) return el
    el = el.parentElement
  }
  return null
}

/**
 * Put the stream in its resting position — pinned to the end, where a topic
 * opens. Expanding the card smooth-scrolls it into view (real product
 * behaviour), so this waits that out before pinning, and every measurement is
 * taken from the same settled state in both frames.
 */
async function settle() {
  await wait(420)
  const s = scroller()
  if (s) s.scrollTo({ top: s.scrollHeight, behavior: 'instant' })
  await frame()
  await frame()
}

async function setExpanded(expanded: boolean) {
  const button = toggleButton()
  if (!button) return
  if (isExpanded() !== expanded) button.click()
  await settle()
}

function setCardVisible(visible: boolean) {
  const el = card()
  if (!el) return
  // Opacity, not display: the row keeps its space in the stream, so the slot
  // the card flies into is already the right size and in the right place.
  el.style.opacity = visible ? '1' : '0'
}

/**
 * The reply that lands under the highlights on the film's last beat. Same
 * reasoning as the card: it holds its space from the start, so revealing it
 * can't shift the stream — it just appears.
 */
function replyRow(): HTMLElement | null {
  const rows = document.querySelectorAll<HTMLElement>('[data-message-card]')
  return rows.length ? rows[rows.length - 1] : null
}

function setReplyVisible(visible: boolean) {
  const el = replyRow()
  if (!el) return
  el.style.opacity = visible ? '1' : '0'
  el.style.transform = visible ? 'none' : 'translateY(6px)'
  el.style.transition = 'opacity 260ms ease-out, transform 260ms ease-out'
}

/**
 * Measure the card in both states, then leave it as it was. Runs once at
 * load, before the player builds its timeline.
 */
async function calibrate() {
  const was = isExpanded()
  await setExpanded(true)
  const expanded = rect()
  await setExpanded(false)
  const collapsed = rect()
  await setExpanded(was)
  if (expanded && collapsed) post('geometry', { collapsed, expanded })
}

/**
 * Drop focus. The composer autofocuses, and its focus ring would sit in every
 * frame of the recording as a cursor nobody put there. The editor takes focus
 * a tick or two after it mounts, so this repeats rather than firing once.
 */
function defocus() {
  const blur = () => (document.activeElement as HTMLElement | null)?.blur()
  blur()
  setTimeout(blur, 200)
  setTimeout(blur, 600)
}

function isCommand(data: unknown): data is Command {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { source?: unknown }).source === TAG &&
    typeof (data as { type?: unknown }).type === 'string'
  )
}

export function installDemoBridge() {
  window.addEventListener('message', (e: MessageEvent) => {
    if (!isCommand(e.data)) return
    switch (e.data.type) {
      case 'calibrate':
        void calibrate()
        break
      case 'set-expanded':
        void setExpanded(e.data.expanded)
        break
      case 'set-card-visible':
        setCardVisible(e.data.visible)
        break
      case 'set-reply-visible':
        setReplyVisible(e.data.visible)
        break
      default:
        post('card-rect', { rect: rect(), expanded: isExpanded() })
    }
  })

  // Announce readiness once the card is actually in the DOM — the player
  // holds playback until both frames report in, so a slow dev-server compile
  // can never be caught on film.
  const announce = () => {
    if (!card()) return false
    defocus()
    post('ready')
    return true
  }
  if (!announce()) {
    const observer = new MutationObserver(() => {
      if (announce()) observer.disconnect()
    })
    observer.observe(document.body, { childList: true, subtree: true })
  }
}
