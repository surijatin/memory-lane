import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { UserFormDialog } from './UserFormDialog'
import { UserPlusIcon } from '@heroicons/react/24/outline'

interface CreateUserDialogProps {
  onUserCreated?: () => void
}

export function CreateUserDialog({ onUserCreated }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant='default'
          className='gap-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white dark:shadow-md dark:shadow-blue-700/20'
        >
          <UserPlusIcon className='h-4 w-4' />
          Add New User
        </Button>
      </DialogTrigger>

      <UserFormDialog
        mode='create'
        open={open}
        onOpenChange={setOpen}
        onUserSaved={onUserCreated}
      />
    </Dialog>
  )
}
