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
      <div className="max-w-4xl mx-auto space-y-4">
        <header className="panel flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">System</p>
            <h1 className="text-lg font-normal">Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="btn-secondary"
          >
            Logout
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="panel space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-medium">Session</h2>
              <span className="text-[9px] px-1 py-0.5 border border-green-900/50 bg-green-950/20 text-green-400">ACTIVE</span>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-[9px] uppercase text-text-muted mb-0.5">Identity</p>
                <p className="text-xs">{user?.email}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase text-text-muted mb-0.5">UID</p>
                <p className="text-[9px] font-mono text-text-muted break-all">{user?.id}</p>
              </div>
            </div>
          </div>

          <div className="panel space-y-3">
            <h2 className="text-xs font-medium">Actions</h2>
            <div className="flex gap-2">
              <button className="btn-primary">Create</button>
              <button className="btn-secondary">Logs</button>
            </div>
          </div>
        </div>

        <div className="panel">
          <p className="text-[10px] text-text-muted leading-tight">
            System operational. Build v0.1.0-alpha.
          </p>
        </div>
      </div>
    </div>
  )
}
