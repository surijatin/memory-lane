import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { MainLayout } from '@/components/layout/MainLayout'
import { HomePage } from '@/components/pages/HomePage'
import { MemoriesPage } from '@/components/pages/MemoriesPage'
import { CreateMemoryLanePage } from '@/components/pages/CreateMemoryLanePage'
import { MemoryLaneDetailPage } from '@/components/pages/MemoryLaneDetailPage'
import { SettingsPage } from '@/components/pages/SettingsPage'
import { SharedMemoryLaneViewPage } from '@/components/pages/SharedMemoryLaneViewPage'

export function AppRoutes() {
  const { currentUser } = useAuth()

  return (
    <Routes>
      {/* Home/Landing Page */}
      <Route path='/' element={<HomePage />} />

      {/* Authenticated Routes */}
      <Route path='/memories' element={<MainLayout />}>
        <Route
          index
          element={
            currentUser ? (
              <MemoriesPage user={currentUser} />
            ) : (
              <Navigate to='/' />
            )
          }
        />
        <Route
          path='create'
          element={
            currentUser ? (
              <CreateMemoryLanePage user={currentUser} />
            ) : (
              <Navigate to='/' />
            )
          }
        />
        <Route
          path='lane/:laneId'
          element={
            currentUser ? (
              <MemoryLaneDetailPage user={currentUser} />
            ) : (
              <Navigate to='/' />
            )
          }
        />
        <Route
          path='settings'
          element={currentUser ? <SettingsPage /> : <Navigate to='/' />}
        />
      </Route>

      {/* Public Share Route - No Authentication Required */}
      <Route path='/share/:shareId' element={<SharedMemoryLaneViewPage />} />

      {/* Catch-all route for non-matching paths */}
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  )
}
