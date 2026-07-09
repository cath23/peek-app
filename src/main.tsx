import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { ThemeProvider } from './lib/theme'
import { DebugProvider } from './lib/debug'
import { PeekDataProvider } from './api'
import { AuthGate } from './auth/AuthGate'
import { LastSelectionProvider } from './lib/lastSelection'
import { ToastProvider } from './lib/toast'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
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
  </BrowserRouter>,
)
