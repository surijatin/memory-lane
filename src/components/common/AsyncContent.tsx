import React from 'react'
import { ErrorDisplay } from './ErrorDisplay'
import { spinnerStyles } from '../../utils/styleUtils'

interface AsyncContentProps {
  loading: boolean
  error: Error | string | null
  children: React.ReactNode
  loadingComponent?: React.ReactNode
  errorComponent?: React.ReactNode
  onRetry?: () => void
}

export function AsyncContent({
  loading,
  error,
  children,
  loadingComponent,
  errorComponent,
  onRetry,
}: AsyncContentProps) {
  // Show loading state
  if (loading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>
    }

    return (
      <div className='flex justify-center items-center p-8'>
        <div className={spinnerStyles}></div>
      </div>
    )
  }

  // Show error state
  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>
    }

    const errorObj = typeof error === 'string' ? new Error(error) : error

    return <ErrorDisplay error={errorObj} onReset={onRetry} />
  }

  // Show content
  return <>{children}</>
}
