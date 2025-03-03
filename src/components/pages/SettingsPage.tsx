import { useTheme } from '@/components/common/theme/ThemeProvider'
import {
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline'

export function SettingsPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-6 text-gray-900 dark:text-white'>
        Settings
      </h1>

      <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6'>
        <h2 className='text-lg font-semibold mb-4 text-gray-900 dark:text-white'>
          Appearance
        </h2>

        <div className='flex items-center justify-between'>
          <label
            htmlFor='theme-toggle'
            className='text-gray-700 dark:text-gray-300'
          >
            Theme Mode
          </label>

          <div className='flex items-center space-x-4'>
            <select
              id='theme-toggle'
              value={theme}
              onChange={(e) =>
                setTheme(e.target.value as 'light' | 'dark' | 'system')
              }
              className='bg-gray-50 border border-gray-300 text-gray-900 rounded-lg 
                         focus:ring-blue-500 focus:border-blue-500 block p-2.5
                         dark:bg-gray-700 dark:border-gray-600 dark:text-white'
            >
              <option value='light'>Light</option>
              <option value='dark'>Dark</option>
              <option value='system'>System</option>
            </select>

            <div
              className='flex items-center justify-center w-10 h-10 rounded-full 
                           bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            >
              {theme === 'dark' ? (
                <MoonIcon className='w-6 h-6' />
              ) : theme === 'light' ? (
                <SunIcon className='w-6 h-6' />
              ) : (
                <ComputerDesktopIcon className='w-6 h-6' />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6'>
        <h2 className='text-lg font-semibold mb-4 text-gray-900 dark:text-white'>
          Account
        </h2>
        {/* Add account settings here */}
        <p className='text-gray-700 dark:text-gray-300'>
          Account settings options will appear here.
        </p>
      </div>
    </div>
  )
}
