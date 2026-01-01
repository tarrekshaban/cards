import { useAuth } from '../hooks/useAuth'

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <p className="text-text-muted">Loading...</p>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <header className="bg-surface-muted border border-border rounded-subtle mb-6">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Dashboard</p>
            <h1 className="text-2xl font-bold">Overview</h1>
          </div>
          <button
            onClick={handleLogout}
            className="btn-secondary w-full sm:w-auto"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-6">
        <div className="panel">
          <h2 className="text-lg font-semibold mb-3">
            Welcome back!
          </h2>
          <p className="text-text-muted">
            You are logged in as <span className="font-medium">{user?.email}</span>
          </p>
          <p className="text-sm text-text-muted mt-2">
            User ID: {user?.id}
          </p>
        </div>

        <div className="panel">
          <h2 className="text-lg font-semibold mb-3">
            Your App Content
          </h2>
          <p className="text-text-muted">
            Start building your application here. This is a protected route that requires authentication.
          </p>
        </div>
      </main>
    </div>
  )
}
