import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  ReactNode,
} from 'react'
import { userService } from '@/services/userService'
import { User } from '@/types'
import { UserCard } from './UserCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { EditUserDialog } from './EditUserDialog'
import {
  ExclamationCircleIcon,
  ArrowPathIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

// Define ref handle type
export type UserListRefHandle = {
  fetchUsers: () => Promise<void>
}

// Define props interface
interface UserListProps {
  createUserDialog?: ReactNode
}

const UserList = forwardRef<UserListRefHandle, UserListProps>(
  ({ createUserDialog }, ref) => {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)

    const fetchUsers = async () => {
      try {
        setLoading(true)
        setError(null)
        const userData = await userService.getUsers()
        setUsers(userData)
      } catch (err) {
        console.error('Error fetching users:', err)
        setError('Failed to load users')
      } finally {
        setLoading(false)
      }
    }

    // Expose the fetchUsers method via ref
    useImperativeHandle(ref, () => ({
      fetchUsers,
    }))

    useEffect(() => {
      fetchUsers()
    }, [])

    const handleViewDetails = (userId: string) => {
      console.log(`View details for user: ${userId}`)
      // You can implement user details view here
    }

    const handleEditUser = (user: User) => {
      setEditingUser(user)
      setEditDialogOpen(true)
    }

    const handleEditDialogOpenChange = (open: boolean) => {
      setEditDialogOpen(open)
      if (!open) {
        // Reset editing user when dialog is closed
        setTimeout(() => setEditingUser(null), 300)
      }
    }

    if (loading) {
      return (
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-2xl font-semibold text-gray-900 dark:text-white'>
              Users
            </h2>
            <div className='flex items-center space-x-2'>
              {createUserDialog}
              <Skeleton className='h-9 w-24' />
            </div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className='border dark:border-gray-700 rounded-lg p-4'
              >
                <div className='flex items-start space-x-3'>
                  <Skeleton className='h-12 w-12 rounded-full' />
                  <div className='space-y-2'>
                    <Skeleton className='h-4 w-32' />
                    <Skeleton className='h-4 w-24' />
                  </div>
                </div>
                <div className='mt-3 space-y-2'>
                  <Skeleton className='h-3 w-full' />
                  <Skeleton className='h-3 w-3/4' />
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-2xl font-semibold text-gray-900 dark:text-white'>
              Users
            </h2>
            <div className='flex items-center space-x-2'>
              {createUserDialog}
              <Button
                onClick={fetchUsers}
                variant='outline'
                className='text-gray-600 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20'
              >
                <ArrowPathIcon className='h-4 w-4 mr-2' />
                Refresh
              </Button>
            </div>
          </div>

          <div className='bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-4 rounded-md flex flex-col items-center'>
            <ExclamationCircleIcon className='h-10 w-10 text-red-500 mb-2' />
            <p className='text-lg font-medium'>{error}</p>
            <Button
              onClick={fetchUsers}
              variant='outline'
              className='mt-4 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20'
            >
              Try Again
            </Button>
          </div>
        </div>
      )
    }

    if (users.length === 0) {
      return (
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-2xl font-semibold text-gray-900 dark:text-white'>
              Users
            </h2>
            <div className='flex items-center space-x-2'>
              {createUserDialog}
              <Button
                onClick={fetchUsers}
                variant='outline'
                size='sm'
                className='text-gray-600 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20'
              >
                <ArrowPathIcon className='h-4 w-4 mr-2' />
                Refresh
              </Button>
            </div>
          </div>

          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <UserGroupIcon className='h-12 w-12 text-gray-400 mb-4' />
            <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
              No users found
            </h3>
            <p className='text-gray-500 dark:text-gray-400 mt-2 max-w-sm'>
              There are no users in the system yet. Click the "Add New User"
              button to create your first user.
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6'>
        <div className='flex justify-between items-center mb-6'>
          <h2 className='text-2xl font-semibold text-gray-900 dark:text-white'>
            Users
          </h2>
          <div className='flex items-center space-x-2'>
            {createUserDialog}
            <Button
              onClick={fetchUsers}
              variant='outline'
              size='sm'
              className='text-gray-600 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20'
            >
              <ArrowPathIcon className='h-4 w-4 mr-2' />
              Refresh
            </Button>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onViewDetails={handleViewDetails}
              onEditUser={handleEditUser}
              onUserUpdated={fetchUsers}
            />
          ))}
        </div>

        {/* Edit User Dialog */}
        <EditUserDialog
          user={editingUser}
          open={editDialogOpen}
          onOpenChange={handleEditDialogOpenChange}
          onUserUpdated={fetchUsers}
        />
      </div>
    )
  }
)

UserList.displayName = 'UserList'

export default UserList
