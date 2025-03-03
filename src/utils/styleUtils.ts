import { cn } from '@/lib/utils'

// Common container styles
export const containerStyles = 'min-h-screen bg-gray-50 dark:bg-gray-900'

// Card styles
export const cardStyles = 'bg-white dark:bg-gray-800 rounded-lg shadow-md'

// Button styles
export function buttonVariants(
  variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'primary'
) {
  const baseStyles =
    'flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'

  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary:
      'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
  }

  return cn(baseStyles, variantStyles[variant])
}

// Layout styles
export const pageLayoutStyles = 'container mx-auto px-4 py-8'

// Heading styles
export const headingStyles = {
  h1: 'text-3xl font-bold text-gray-900 dark:text-white',
  h2: 'text-2xl font-bold text-gray-900 dark:text-white',
  h3: 'text-xl font-bold text-gray-900 dark:text-white',
  h4: 'text-lg font-bold text-gray-900 dark:text-white',
}

// Loading spinner styles
export const spinnerStyles =
  'animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 dark:border-blue-400'

// Form styles
export const formStyles = {
  label: 'block text-sm font-medium text-gray-700 dark:text-gray-300',
  input:
    'mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
}

// Error styles
export const errorStyles = 'text-red-500 dark:text-red-400 text-sm font-medium'
