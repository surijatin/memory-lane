import { User } from '../../types'
import { CreateMemoryLane } from '@/components/features/memory-lane/CreateMemoryLane'

interface CreateMemoryLanePageProps {
  user: User
}

export function CreateMemoryLanePage({ user }: CreateMemoryLanePageProps) {
  return <CreateMemoryLane user={user} />
}
