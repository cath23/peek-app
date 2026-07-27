/**
 * Demo bridge — how the scenario player drives the embedded app.
 *
 * Installed only in demo mode (see ./demoMode), from main.tsx. The player
 * (demo-scenarios/src/scenes/PeekTopic.tsx) needs two things from the embed:
 *
 *   1. to expand the highlights card on a beat, and
 *   2. to know where that card is on screen, so its camera can zoom to it.
 *
 * Both are done against the real DOM: the bridge clicks the card's own
 * Expand button, so the recording shows the real component reacting, and it
 * measures the real element. Nothing in the app has to know it is being
 * filmed beyond the `data-highlights-card` / `data-highlights-toggle` hooks
 * the card already carries.
 *
 * Messages are plain JSON over postMessage (the player is a different
 * origin — its own dev server), all tagged `peek-demo`.
 */

const TAG = 'peek-demo'

/** Player → app. */
type Command =
  | { source: typeof TAG; type: 'expand' }
  | { source: typeof TAG; type: 'collapse' }
  | { source: typeof TAG; type: 'measure' }

interface CardRect {
  x: number
  y: number
  width: number
  height: number
}

function card(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-highlights-card]')
}

function post(type: string, payload?: Record<string, unknown>) {
  window.parent?.postMessage({ source: TAG, type, ...payload }, '*')
}

/** Report the card's viewport rect (CSS pixels of the iframe). */
function postRect() {
  const el = card()
  if (!el) return
  const r = el.getBoundingClientRect()
  const rect: CardRect = { x: r.x, y: r.y, width: r.width, height: r.height }
  const expanded = el.querySelector('[data-highlights-toggle]')?.textContent?.trim() === 'Minimize'
  post('card-rect', { rect, expanded })
}

/** Rect after the browser has laid out and painted the new state. */
function postRectSoon() {
  requestAnimationFrame(() => requestAnimationFrame(postRect))
}

function toggle(want: 'expand' | 'collapse') {
  const el = card()
  const button = el?.querySelector<HTMLButtonElement>('[data-highlights-toggle]')
  if (!el || !button) return
  const isExpanded = button.textContent?.trim() === 'Minimize'
  if ((want === 'expand') === isExpanded) {
    postRectSoon()
    return
  }
  button.click()
  // The card grows downwards; keep it in frame the way a person scrolling
  // would, then hand the settled rect to the player's camera.
  requestAnimationFrame(() => {
    card()?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(postRect, 380)
  })
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
    if (e.data.type === 'expand') toggle('expand')
    else if (e.data.type === 'collapse') toggle('collapse')
    else postRect()
  })

  // Announce readiness once the card is actually in the DOM — the player
  // holds the first Peek beat until then, so a slow dev-server compile can
  // never be caught on film.
  const announce = () => {
    if (!card()) return false
    defocus()
    post('ready')
    postRect()
    return true
  }
  if (!announce()) {
    const observer = new MutationObserver(() => {
      if (announce()) observer.disconnect()
    })
    observer.observe(document.body, { childList: true, subtree: true })
  }

  window.addEventListener('resize', postRect)
}
