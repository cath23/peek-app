/**
 * App smoke test — mounts the real page tree with the real provider stack
 * (same composition as main.tsx, minus Analytics) and verifies each page
 * renders its data through the src/api seam. Guards the seam wiring:
 * a broken provider or merge regression fails here before anyone opens
 * the app.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@/lib/theme'
import { DebugProvider } from '@/lib/debug'
import { PeekDataProvider } from '@/api'
import { LastSelectionProvider } from '@/lib/lastSelection'
import { ToastProvider } from '@/lib/toast'
import App from './App'

function renderApp(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>
        <DebugProvider>
          <PeekDataProvider>
            <LastSelectionProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </LastSelectionProvider>
          </PeekDataProvider>
        </DebugProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('app smoke (seam wiring)', () => {
  // Text queries use getAllByText — labels legitimately repeat across the
  // nav rail, headers, list rows, and cards.
  const present = (matcher: string | RegExp) => screen.getAllByText(matcher).length

  it('renders the Desk page sections from the seam', () => {
    renderApp('/desk')
    expect(present('Desk')).toBeGreaterThan(0)
    expect(present('Open work')).toBeGreaterThan(0)
    expect(present('Starred')).toBeGreaterThan(0)
    // Screener item (seeded) + Open work topics + a starred DM
    expect(present('Updates on the new office layout')).toBeGreaterThan(0)
    expect(present('Launch checklist for v2 of the mobile app')).toBeGreaterThan(0)
    expect(present('Greg Bothman')).toBeGreaterThan(0)
  })

  it('renders a topic conversation and opens its thread panel', () => {
    renderApp('/topics/3')
    // Topic list + selected topic's messages (merged through useTopicMessages)
    expect(present('Ongoing onboarding issues')).toBeGreaterThan(0)
    const message = screen.getAllByText(/Funnel data is in/)[0]
    // Open the thread panel (global useThread lookup)
    fireEvent.click(message)
    expect(present('Replies')).toBeGreaterThan(0)
    expect(present(/41% drop-off is worse than I expected/)).toBeGreaterThan(0)
  })

  it('renders a DM conversation with merged reply counts', () => {
    renderApp('/people/1')
    expect(present('Alice Johnson')).toBeGreaterThan(0)
    // Token-free line (reference chips like #48821 split text nodes)
    expect(present(/EU completions dropped 28% in 5 days/)).toBeGreaterThan(0)
    // dm1_c5 has 3 static replies — the thread panel shows them merged
    const message = screen.getAllByText(/current export design assumes synchronous generation/)[0]
    fireEvent.click(message)
    expect(present('Replies')).toBeGreaterThan(0)
    expect(present(/job queue approach makes more sense/)).toBeGreaterThan(0)
  })
})
