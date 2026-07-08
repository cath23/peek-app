import { Routes, Route, Navigate } from 'react-router-dom'
import { DeskPage } from './pages/DeskPage'
import { TopicsPage } from './pages/TopicsPage'
import { PeoplePage } from './pages/PeoplePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/desk" replace />} />
      <Route path="/desk" element={<DeskPage />} />
      <Route path="/topics" element={<TopicsPage />} />
      <Route path="/topics/:id" element={<TopicsPage />} />
      <Route path="/people" element={<PeoplePage />} />
      <Route path="/people/:id" element={<PeoplePage />} />
    </Routes>
  )
}

export default App
