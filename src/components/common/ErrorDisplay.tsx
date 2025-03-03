import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Button } from '../ui/button'
import { errorStyles } from '../../utils/styleUtils'
import { cn } from '../../lib/utils'

interface ErrorDisplayProps {
  title?: string
  error?: Error | null
  message?: string
  onReset?: () => void
  className?: string
}

export function ErrorDisplay({
  title = 'Something went wrong',
  error,
  message,
  onReset,
  className,
}: ErrorDisplayProps) {
  const errorMessage =
    message || error?.message || 'An unexpected error occurred'

  return (
    <div
      className={cn('p-6 rounded-lg bg-red-50 dark:bg-red-900/20', className)}
    >
      <div className='flex items-start'>
        <div className='flex-shrink-0'>
          <ExclamationTriangleIcon
            className='h-6 w-6 text-red-600 dark:text-red-400'
            aria-hidden='true'
          />
        </div>
        <div className='ml-3'>
          <h3 className='text-lg font-medium text-red-800 dark:text-red-300'>
            {title}
          </h3>
          <div className='mt-2 text-sm text-red-700 dark:text-red-200'>
            <p>{errorMessage}</p>
            {error && process.env.NODE_ENV !== 'production' && (
              <pre className='mt-2 text-xs overflow-auto max-h-40 bg-red-100 dark:bg-red-900/40 p-2 rounded'>
                {error.stack}
              </pre>
            )}
          </div>
          {onReset && (
            <div className='mt-4'>
              <Button
                onClick={onReset}
                variant='outline'
                className='border-red-300 bg-white text-red-700 hover:bg-red-50 dark:border-red-700 dark:bg-transparent dark:text-red-300 dark:hover:bg-red-900/30'
              >
                Try again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Simple inline error display for form fields and other small error messages
export function InlineError({ message }: { message?: string }) {
  if (!message) return null
  return <p className={errorStyles}>{message}</p>
}
