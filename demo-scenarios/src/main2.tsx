import { createRoot } from 'react-dom/client'
import { Player2 } from './player2'
import './styles.css'

// No StrictMode: its double mount would build the timeline twice.
createRoot(document.getElementById('root')!).render(<Player2 />)
