import { createRoot } from 'react-dom/client'
import { Player } from './player'
import './styles.css'

// No StrictMode: its double mount would build the timeline twice and load the
// embedded app frames twice over.
createRoot(document.getElementById('root')!).render(<Player />)
