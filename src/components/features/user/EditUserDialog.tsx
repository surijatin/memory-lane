import { User } from '../types'
import { UserFormDialog } from './UserFormDialog'

interface EditUserDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserUpdated?: () => void
}

export function EditUserDialog({
  user,
  open,
  onOpenChange,
  onUserUpdated,
}: EditUserDialogProps) {
  return (
    <UserFormDialog
      mode='edit'
      user={user}
      open={open}
      onOpenChange={onOpenChange}
      onUserSaved={onUserUpdated}
    />
  )
}
