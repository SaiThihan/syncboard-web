import { Navigate, Route, Routes } from 'react-router'
import BoardPage from '@/pages/BoardPage'
import HomePage from '@/pages/HomePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/board/:boardId" element={<BoardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
