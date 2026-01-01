import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function HomePage() {
  const { user, isLoading } = useAuth()

  return (
    <div className="page-shell flex flex-col items-center">
      <div className="w-full max-w-xl panel text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold">
          Welcome to Cards
        </h1>
        <p className="text-base sm:text-lg text-text-muted">
          Your application is ready to go.
        </p>

        {isLoading ? (
          <p className="text-text-muted">Loading...</p>
        ) : user ? (
          <Link to="/dashboard" className="btn-primary w-full sm:w-auto">
            Go to Dashboard
          </Link>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/login" className="btn-primary w-full sm:w-auto">
              Login
            </Link>
            <Link to="/signup" className="btn-secondary w-full sm:w-auto">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
