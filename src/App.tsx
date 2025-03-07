import { Toaster } from 'sonner'
import { AuthProvider } from './contexts/AuthContext'
import { AppRoutes } from './routes'
import { ErrorBoundary } from './components/common/ErrorBoundary'
// import { ThemeToggle } from './components/ThemeToggle'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRoutes />

        {/* Toaster for notifications */}
        <Toaster position='top-right' richColors closeButton />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
