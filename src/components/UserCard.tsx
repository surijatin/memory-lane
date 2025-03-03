import { User } from '@/types'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { userService } from '@/services/userService'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'

interface UserCardProps {
  user: User
  onViewDetails?: (userId: string) => void
  onEditUser?: (user: User) => void
  onUserUpdated?: () => void
}

export function UserCard({
  user,
  onViewDetails,
  onEditUser,
  onUserUpdated,
}: UserCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const navigate = useNavigate()
  const { login } = useAuth()

  // Get initials for avatar
  const getInitials = () => {
    const firstInitial = user.first_name ? user.first_name[0] : ''
    const lastInitial = user.last_name ? user.last_name[0] : ''
    return (firstInitial + lastInitial).toUpperCase()
  }

  // Format time since registration
  const getTimeSince = () => {
    if (!user.created_at) return ''

    const createdDate = new Date(user.created_at)
    const now = new Date()
    const diffInSeconds = Math.floor(
      (now.getTime() - createdDate.getTime()) / 1000
    )

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)} days ago`

    // Just return the date if it's older
    return createdDate.toLocaleDateString()
  }

  const handleDeleteUser = async () => {
    try {
      setIsDeleting(true)
      // Set isActive to false instead of actually deleting
      await userService.updateUser(user.id, { isActive: false })
      // Call onUserUpdated to refresh the list
      if (onUserUpdated) {
        onUserUpdated()
      }
    } catch (error) {
      console.error('Error deactivating user:', error)
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const handleLogin = async () => {
    try {
      await login(user.username)
      navigate('/memories')
    } catch (error) {
      console.error('Login failed:', error)
      // You could add a toast notification here
    }
  }

  return (
    <Card className='overflow-hidden transition-all hover:shadow-md relative'>
      <CardHeader className='p-4 pb-2'>
        <div className='absolute top-3 right-3 z-10'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 rounded-full'
              >
                <EllipsisVerticalIcon className='h-5 w-5' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => onEditUser && onEditUser(user)}>
                <div className='flex items-center text-gray-700 dark:text-gray-300'>
                  <PencilIcon className='h-4 w-4 mr-2' />
                  Edit
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='text-red-600 dark:text-red-400'
                onClick={() => setDeleteDialogOpen(true)}
              >
                <div className='flex items-center text-red-600 dark:text-red-400'>
                  <TrashIcon className='h-4 w-4 mr-2' />
                  Delete
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className='flex items-center space-x-3'>
          <Avatar className='h-12 w-12 border'>
            {user.avatar_path ? (
              <AvatarImage
                src={user.avatar_path}
                alt={`${user.first_name} ${user.last_name}`}
              />
            ) : (
              <AvatarFallback className='bg-primary/10 text-primary'>
                {getInitials()}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <CardTitle className='text-lg text-gray-900 dark:text-white'>
              {user.first_name} {user.last_name}
            </CardTitle>
            <CardDescription className='text-sm'>
              @{user.username}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className='p-4 pt-2 min-h-[80px] flex flex-col'>
        {user.description && (
          <p className='text-sm text-gray-600 dark:text-gray-300 line-clamp-3'>
            {user.description}
          </p>
        )}
        {!user.description && (
          <p className='text-sm text-gray-400 dark:text-gray-500 italic'>
            No description available
          </p>
        )}
      </CardContent>
      <CardFooter className='p-4 pt-0 flex items-center justify-between mt-auto'>
        <span className='text-xs text-gray-500 dark:text-gray-400'>
          Joined {getTimeSince()}
        </span>
        {onViewDetails && (
          <Button
            variant='ghost'
            size='sm'
            className='text-primary hover:text-primary/80 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/30'
            onClick={handleLogin}
          >
            Login
          </Button>
        )}
      </CardFooter>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className='dark:bg-gray-800 dark:text-white'>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Profile</AlertDialogTitle>
            <AlertDialogDescription className='dark:text-gray-300'>
              <div className='bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-4 rounded-md flex items-start mb-4'>
                <InformationCircleIcon className='h-5 w-5 mr-2 flex-shrink-0 mt-0.5' />
                <div>
                  <p className='font-medium'>Warning</p>
                  <p className='text-sm'>
                    This action cannot be undone. The user and all associated
                    data will be permanently deleted.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className='bg-red-600 hover:bg-red-700'
            >
              {isDeleting ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
