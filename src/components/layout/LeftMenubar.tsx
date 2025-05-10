import { Link, useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CubeIcon } from '@heroicons/react/20/solid'
import { CogIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

export function LeftMenubar() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  // Get initials for avatar
  const getInitials = () => {
    if (!currentUser) return ''
    const firstInitial = currentUser.first_name ? currentUser.first_name[0] : ''
    const lastInitial = currentUser.last_name ? currentUser.last_name[0] : ''
    return (firstInitial + lastInitial).toUpperCase()
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className='w-64 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col'>
      {/* Logo */}
      <div className='p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center'>
        <Link to='/' className='flex items-center'>
          <div className='bg-blue-600 rounded-md p-1.5 mr-2'>
            <CubeIcon className='h-5 w-5 text-white' />
          </div>
          <span className='text-xl font-bold text-gray-900 dark:text-white'>
            Memory Lane
          </span>
        </Link>
      </div>

      {/* Nav Links */}
      <nav className='flex-1 p-4 space-y-1 overflow-y-auto'>
        <NavLink to='/memories' icon={<PhotoIcon className='h-5 w-5' />} exact>
          Memory Lanes
        </NavLink>
        <NavLink to='/memories/settings' icon={<CogIcon className='h-5 w-5' />}>
          Settings
        </NavLink>
      </nav>

      {/* User Profile */}
      {currentUser && (
        <div className='p-4 border-t border-gray-200 dark:border-gray-700 mt-auto'>
          <div className='flex items-center'>
            <Avatar className='h-8 w-8 mr-2'>
              {currentUser.avatar_path ? (
                <AvatarImage
                  src={currentUser.avatar_path}
                  alt={`${currentUser.first_name} ${currentUser.last_name}`}
                />
              ) : (
                <AvatarFallback className='bg-primary/10 text-primary text-xs'>
                  {getInitials()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                {currentUser.first_name} {currentUser.last_name}
              </p>
              <button
                onClick={handleLogout}
                className='text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300'
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface NavLinkProps {
  to: string
  children: React.ReactNode
  icon?: React.ReactNode
  exact?: boolean
}

function NavLink({ to, children, icon, exact }: NavLinkProps) {
  // Check if current path matches this link
  const currentPath = window.location.pathname
  const isActive = exact ? currentPath === to : currentPath.startsWith(to)

  return (
    <Link
      to={to}
      className={cn(
        'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
        isActive
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/30'
      )}
    >
      {icon && <span className='mr-3'>{icon}</span>}
      {children}
    </Link>
  )
}
