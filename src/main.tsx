import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { ThemeProvider } from './lib/theme'
import { DebugProvider } from './lib/debug'
import { PeekDataProvider } from './api'
import { AuthGate } from './auth/AuthGate'
import { LastSelectionProvider } from './lib/lastSelection'
import { ToastProvider } from './lib/toast'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { demoMode } from './demo/demoMode'
import { installDemoBridge } from './demo/demoBridge'
import './index.css'
import App from './App.tsx'

// Recording rig only (`?demo=1`) — lets the scenario player drive this embed.
if (demoMode) installDemoBridge()

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    {/* Root boundary: the last line of defense — providers or a whole page
        crashing degrades to the fallback instead of a white screen. */}
    <ErrorBoundary label="app" fallbackClassName="h-screen flex items-center justify-center bg-bg-base">
      <ThemeProvider>
        <DebugProvider>
          <PeekDataProvider>
            <AuthGate>
              <LastSelectionProvider>
                <ToastProvider>
                  <App />
                  <Analytics />
                </ToastProvider>
              </LastSelectionProvider>
            </AuthGate>
          </PeekDataProvider>
        </DebugProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </BrowserRouter>,
)
