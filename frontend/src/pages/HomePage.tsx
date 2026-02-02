import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth()

  // Redirect to dashboard if already logged in
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="page-shell flex flex-col items-center justify-center">
      <div className="w-full max-w-xl panel space-y-6 rounded-2xl bg-gradient-to-br from-surface-raised via-surface-muted/60 to-surface-raised border-border/70 shadow-[0_16px_40px_rgba(0,0,0,0.4)]">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Card Benefits Tracker</p>
          <h1 className="text-2xl font-normal">Never Miss a Benefit</h1>
          <p className="text-sm text-text-muted">
            Track your credit card benefits, maximize redemptions, and see the real value you're getting from your cards.
          </p>
        </div>

        <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {isLoading ? (
            <p className="text-xs text-text-muted">Loading...</p>
          ) : (
            <>
              <Link to="/login" className="btn-primary w-full sm:w-auto">
                Sign in
              </Link>
              <Link to="/signup" className="btn-secondary w-full sm:w-auto">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
