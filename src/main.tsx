import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { ThemeProvider } from './lib/theme'
import { DebugProvider } from './lib/debug'
import { StarredProvider } from './lib/starred'
import { TopicStoreProvider } from './lib/topicStore'
import { TopicMutationsProvider } from './lib/topicMutations'
import { LastSelectionProvider } from './lib/lastSelection'
import { ToastProvider } from './lib/toast'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ThemeProvider>
      <DebugProvider>
        <StarredProvider>
          <TopicStoreProvider>
            <TopicMutationsProvider>
              <LastSelectionProvider>
                <ToastProvider>
                  <App />
                  <Analytics />
                </ToastProvider>
              </LastSelectionProvider>
            </TopicMutationsProvider>
          </TopicStoreProvider>
        </StarredProvider>
      </DebugProvider>
    </ThemeProvider>
  </BrowserRouter>,
)
