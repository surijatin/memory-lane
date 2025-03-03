import { useEffect } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import { LeftMenubar } from './LeftMenubar'
import { useAuth } from '../../contexts/AuthContext'

export function MainLayout() {
  const { currentUser, loading, error } = useAuth()
  const navigate = useNavigate()

  // Redirect to home if no authenticated user
  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/')
    }
  }, [currentUser, loading, navigate])

  if (loading) {
    return (
      <div className='flex min-h-screen bg-gray-50 dark:bg-gray-900'>
        <div className='w-full flex justify-center items-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 dark:border-blue-400'></div>
        </div>
      </div>
    )
  }

  if (error || !currentUser) {
    return (
      <div className='flex min-h-screen bg-gray-50 dark:bg-gray-900'>
        <div className='w-full flex flex-col justify-center items-center'>
          <div className='text-xl font-semibold text-red-500 dark:text-red-400 mb-2'>
            {error || 'Authentication required'}
          </div>
          <button
            onClick={() => navigate('/')}
            className='text-blue-500 dark:text-blue-400 hover:underline'
          >
            Return to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='flex min-h-screen h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden'>
      {/* Sidebar - fixed height */}
      <div className='h-full'>
        <LeftMenubar />
      </div>

      {/* Main Content - scrollable */}
      <div className='flex-1 overflow-auto'>
        <Outlet />
      </div>
    </div>
  )
}
