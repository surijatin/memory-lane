import { User } from '@/types'
import { MemoryLaneDetail } from '@/components/features/memory-lane/MemoryLaneDetail'

interface MemoryLaneDetailPageProps {
  user: User
}

export function MemoryLaneDetailPage({ user }: MemoryLaneDetailPageProps) {
  return <MemoryLaneDetail user={user} />
}
