import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function HomePage() {
  const { user, isLoading } = useAuth()

  return (
    <div className="page-shell flex flex-col items-center justify-center">
      <div className="w-full max-w-xl panel space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Introduction</p>
          <h1 className="text-2xl font-normal">Welcome to Cards</h1>
          <p className="text-sm text-text-muted">
            A high-density, minimal boilerplate for full-stack development.
          </p>
        </div>

        <div className="pt-6 border-t border-border flex items-center gap-3">
          {isLoading ? (
            <p className="text-xs text-text-muted">Authenticating...</p>
          ) : user ? (
            <Link to="/dashboard" className="btn-primary">
              Enter Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-primary">
                Sign in
              </Link>
              <Link to="/signup" className="btn-secondary">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
