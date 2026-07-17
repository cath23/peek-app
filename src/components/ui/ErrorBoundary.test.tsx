import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { ErrorBoundary } from './ErrorBoundary'

function Bomb({ defused }: { defused: boolean }) {
  if (!defused) throw new Error('boom')
  return <div>recovered content</div>
}

/** Flips the crash condition off OUTSIDE the boundary, so "Try again" can
 *  demonstrate a real recovery (a still-broken child would just re-crash). */
function Harness() {
  const [defused, setDefused] = useState(false)
  return (
    <>
      <button onClick={() => setDefused(true)}>defuse</button>
      <ErrorBoundary label="test panel">
        <Bomb defused={defused} />
      </ErrorBoundary>
    </>
  )
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // React logs the caught error; keep test output quiet.
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('degrades a crashing subtree to the inline fallback', () => {
    render(<Harness />)
    expect(screen.getByText(/Something went wrong in the test panel/)).toBeTruthy()
    expect(screen.queryByText('recovered content')).toBeNull()
  })

  it('"Try again" re-mounts the subtree', () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('defuse'))
    fireEvent.click(screen.getByText('Try again'))
    expect(screen.getByText('recovered content')).toBeTruthy()
    expect(screen.queryByText(/Something went wrong/)).toBeNull()
  })

  it('renders children untouched when nothing throws', () => {
    render(
      <ErrorBoundary>
        <div>healthy</div>
      </ErrorBoundary>,
    )
    expect(screen.getByText('healthy')).toBeTruthy()
  })
})
