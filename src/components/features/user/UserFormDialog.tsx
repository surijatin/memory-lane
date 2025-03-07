import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { userService } from '@/services/userService'
import { User } from '@/types'
import { AvatarUpload } from '@/components/features/image/AvatarUpload'
import { toast } from 'sonner'
import { XCircleIcon } from '@heroicons/react/24/solid'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'

// Define Supabase error interface
interface SupabaseError {
  code?: string
  details?: string
  hint?: string | null
  message?: string
}

// Define schema for user form validation
const createUserFormSchema = z.object({
  username: z.string().min(2, {
    message: 'Username must be at least 2 characters.',
  }),
  first_name: z.string().min(1, { message: 'First name is required.' }),
  last_name: z.string().min(1, { message: 'Last name is required.' }),
  description: z.string().optional(),
})

// Define schema for edit form without username
const editUserFormSchema = z.object({
  first_name: z.string().min(1, { message: 'First name is required.' }),
  last_name: z.string().min(1, { message: 'Last name is required.' }),
  description: z.string().optional(),
})

type CreateUserFormValues = z.infer<typeof createUserFormSchema>
type EditUserFormValues = z.infer<typeof editUserFormSchema>

type UserFormMode = 'create' | 'edit'

interface UserFormDialogProps {
  mode: UserFormMode
  user?: User | null // Required for edit mode
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserSaved?: (user: User) => void // Callback for both create and edit
}

export function UserFormDialog({
  mode = 'create',
  user = null,
  open,
  onOpenChange,
  onUserSaved,
}: UserFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [currentAvatarPath, setCurrentAvatarPath] = useState<string | null>(
    null
  )

  // Create form based on mode
  const createForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      username: '',
      first_name: '',
      last_name: '',
      description: '',
    },
    mode: 'onBlur',
  })

  const editForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      description: '',
    },
    mode: 'onBlur',
  })

  // Use the appropriate form based on mode
  // const form = mode === 'create' ? createForm : editForm

  // Update form values when user changes (for edit mode)
  useEffect(() => {
    if (mode === 'edit' && user) {
      // Reset the form with user data
      editForm.reset({
        first_name: user.first_name,
        last_name: user.last_name,
        description: user.description || '',
      })

      // Set the current avatar path from user data
      setCurrentAvatarPath(user.avatar_path || null)

      // Make sure avatar file is reset when switching users
      setAvatarFile(null)
    }
  }, [user, editForm, mode])

  // Reset form state when dialog is closed (for create mode)
  useEffect(() => {
    if (!open && mode === 'create') {
      // Reset form and state when dialog is closed
      createForm.reset({
        username: '',
        first_name: '',
        last_name: '',
        description: '',
      })
      setError(null)
      setAvatarFile(null)
    }
  }, [open, mode, createForm])

  // Handle avatar file changes
  const handleAvatarChange = (file: File | null) => {
    setAvatarFile(file)

    // If avatar is removed, also clear the current avatar path
    if (file === null) {
      setCurrentAvatarPath(null)
    }

    // Clear any error that might be related to avatar upload
    if (error && error.includes('avatar')) {
      setError(null)
    }
  }

  // Check if username is available (only for create mode)
  const checkUsernameAvailability = async (username: string) => {
    try {
      // Skip check for empty username
      if (!username || username.length < 2) return true

      const users = await userService.getUsers()
      return !users.some(
        (user) => user.username.toLowerCase() === username.toLowerCase()
      )
    } catch (err) {
      console.error('Error checking username:', err)
      return true // Allow submission, server will validate
    }
  }

  // Validate username onBlur (only for create mode)
  const validateUsername = async (username: string) => {
    if (mode !== 'create') return
    if (username.length < 2) return // Let Zod handle this validation

    const isAvailable = await checkUsernameAvailability(username)
    if (!isAvailable) {
      createForm.setError('username', {
        type: 'manual',
        message: 'This username is already taken',
      })
    } else {
      createForm.clearErrors('username')
    }
  }

  // Create mode submit handler
  const onCreateSubmit = async (data: CreateUserFormValues) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Handle avatar upload if a file is selected
      let avatarPath = null

      if (avatarFile) {
        try {
          // The avatarFile is already compressed and cropped by AvatarUpload component
          avatarPath = await userService.uploadAvatar(avatarFile, data.username)
        } catch (uploadError) {
          console.error('Error uploading avatar:', uploadError)
          throw new Error('Failed to upload avatar image. Please try again.')
        }
      }

      // Create a new user
      const createdUser = await userService.createUser({
        username: data.username,
        first_name: data.first_name,
        last_name: data.last_name,
        description: data.description || null,
        avatar_path: avatarPath,
      })

      // Show success toast
      toast.success('User created', {
        description: 'The user has been created successfully.',
      })

      // Notify parent component and close dialog
      onOpenChange(false)
      if (onUserSaved) {
        onUserSaved(createdUser)
      }
    } catch (err) {
      handleError(err, 'creating')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit form submission
  const onEditSubmit = async (data: EditUserFormValues) => {
    if (!user) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Handle avatar upload if a file is selected
      let avatarPath = currentAvatarPath

      if (avatarFile && user.username) {
        try {
          // If there's a current avatar, delete it first
          if (currentAvatarPath) {
            const oldFilename = currentAvatarPath.split('/').pop()
            if (oldFilename) {
              await userService.deleteAvatar(oldFilename)
            }
          }

          // Upload the new avatar
          avatarPath = await userService.uploadAvatar(avatarFile, user.username)
        } catch (err) {
          console.error('Avatar upload error:', err)
          setError('Failed to upload avatar image. Please try again.')
          setIsSubmitting(false)
          return
        }
      } else if (
        avatarFile === null &&
        currentAvatarPath === null &&
        user.avatar_path
      ) {
        // Avatar was explicitly removed - delete the old one from storage
        try {
          const oldFilename = user.avatar_path.split('/').pop()
          if (oldFilename) {
            await userService.deleteAvatar(oldFilename)
          }
          avatarPath = null // Ensure it's set to null for the database update
        } catch (err) {
          console.error('Avatar deletion error:', err)
          // We'll continue with the update even if avatar deletion fails
        }
      }

      const updatedUser = await userService.updateUser(user.id, {
        first_name: data.first_name,
        last_name: data.last_name,
        description: data.description,
        avatar_path: avatarPath, // This will be null if avatar was removed
      })

      // Show success toast
      toast.success('Profile updated', {
        description: 'Your profile has been updated successfully.',
      })

      // Close the dialog and pass updated user data back
      onOpenChange(false)
      onUserSaved?.(updatedUser)
    } catch (err) {
      console.error('Error updating user:', err)
      setError('Failed to update profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Common error handling function
  const handleError = (err: unknown, action: 'creating' | 'updating') => {
    console.error(`Error ${action} user:`, err)

    // Handle Supabase error format
    let errorMessage = `An error occurred ${action} the user`

    // Check if it's a Supabase PostgreSQL error
    if (typeof err === 'object' && err !== null) {
      const supabaseError = err as SupabaseError

      // Handle unique constraint violation (code 23505)
      if (supabaseError.code === '23505') {
        if (supabaseError.message?.includes('users_username_key')) {
          errorMessage =
            'This username is already taken. Please choose a different username.'
        } else {
          // Extract details for other constraint violations
          errorMessage =
            supabaseError.details || supabaseError.message || errorMessage
        }
      } else if (supabaseError.message) {
        // Use the error message if available
        errorMessage = supabaseError.message
      } else if (err instanceof Error) {
        // Fallback to standard Error objects
        errorMessage = err.message
      }
    }

    setError(errorMessage)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[525px]'>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New User' : 'Edit User Profile'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new user for the Memory Lane.'
              : `Update ${user?.username}'s profile information.`}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className='bg-red-50 text-red-800 p-3 rounded-md mb-4'>
            <div className='flex items-start'>
              <XCircleIcon className='h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0' />
              <div>
                <p className='font-medium'>{error}</p>
                {error.includes('username is already taken') && (
                  <p className='text-sm mt-1'>
                    Try adding numbers or special characters to make your
                    username unique.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {mode === 'create' ? (
          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(onCreateSubmit)}
              className='space-y-4'
            >
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6 items-start'>
                <div className='md:col-span-1 flex justify-center'>
                  <AvatarUpload
                    onChange={handleAvatarChange}
                    defaultImageUrl={undefined}
                    disabled={isSubmitting}
                  />
                </div>

                <div className='md:col-span-2 space-y-4'>
                  <FormField
                    control={createForm.control}
                    name='username'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Enter a unique username'
                            {...field}
                            disabled={isSubmitting}
                            onBlur={() => validateUsername(field.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='grid grid-cols-2 gap-4'>
                    <FormField
                      control={createForm.control}
                      name='first_name'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='First name'
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name='last_name'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Last name'
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <Separator className='my-4' />

              <FormField
                control={createForm.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Tell us a bit about this user'
                        className='resize-none'
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      A brief bio or description for this user's profile.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dialog footer with action buttons */}
              <DialogFooter className='mt-6'>
                <DialogClose asChild>
                  <Button
                    variant='outline'
                    type='button'
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </DialogClose>

                <Button
                  type='submit'
                  form='create-form'
                  onClick={createForm.handleSubmit(onCreateSubmit)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className='space-y-4'
            >
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6 items-start'>
                <div className='md:col-span-1 flex justify-center'>
                  <AvatarUpload
                    onChange={handleAvatarChange}
                    defaultImageUrl={currentAvatarPath || undefined}
                    disabled={isSubmitting}
                  />
                </div>

                <div className='md:col-span-2 space-y-4'>
                  <div className='p-3 bg-gray-50 rounded-md'>
                    <p className='text-sm text-gray-600 font-medium'>
                      @{user?.username}
                    </p>
                    <p className='text-xs text-gray-500'>
                      Username cannot be changed
                    </p>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <FormField
                      control={editForm.control}
                      name='first_name'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='First name'
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name='last_name'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Last name'
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <Separator className='my-4' />

              <FormField
                control={editForm.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Tell us a bit about this user'
                        className='resize-none'
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      A brief bio or description for this user's profile.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dialog footer with action buttons */}
              <DialogFooter className='mt-6'>
                <DialogClose asChild>
                  <Button
                    variant='outline'
                    type='button'
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </DialogClose>

                <Button
                  type='submit'
                  form='edit-form'
                  onClick={editForm.handleSubmit(onEditSubmit)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
