import { useAuth } from '../hooks/useAuth'

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Welcome back!
          </h2>
          <p className="text-gray-600">
            You are logged in as <span className="font-medium">{user?.email}</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            User ID: {user?.id}
          </p>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Your App Content
          </h2>
          <p className="text-gray-600">
            Start building your application here. This is a protected route that requires authentication.
          </p>
        </div>
      </main>
    </div>
  )
}
