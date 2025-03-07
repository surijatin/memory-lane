import { useState, useEffect } from 'react'
import { User } from '@/types'
import { MemoriesTab } from '@/components/features/memories/MemoriesTab'
import { AsyncContent } from '@/components/common/AsyncContent'
import { memoryLaneService } from '@/services/memoryLaneService'
import { pageLayoutStyles } from '@/utils/styleUtils'

interface MemoriesPageProps {
  user: User
}

export function MemoriesPage({ user }: MemoriesPageProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        // We'll just fetch the lanes to demonstrate the pattern,
        // the actual display is still handled by MemoriesTab
        await memoryLaneService.getUserMemoryLanes(user.id)
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to fetch memory lanes')
        )
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user.id])

  // Demonstrate pattern, but keep using MemoriesTab for now
  return (
    <div className={pageLayoutStyles}>
      <AsyncContent
        loading={loading}
        error={error}
        onRetry={() => {
          setLoading(true)
          memoryLaneService
            .getUserMemoryLanes(user.id)
            .then(() => {
              setError(null)
            })
            .catch((err: unknown) => {
              setError(
                err instanceof Error
                  ? err
                  : new Error('Failed to fetch memory lanes')
              )
            })
            .finally(() => {
              setLoading(false)
            })
        }}
      >
        <MemoriesTab user={user} />
      </AsyncContent>
    </div>
  )
}
