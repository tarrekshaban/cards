import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const navLinks = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/my-cards', label: 'My Cards' },
  { path: '/cards', label: 'Browse' },
]

export default function NavBar() {
  const location = useLocation()
  const { logout, isAdmin } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = async () => {
    setIsMenuOpen(false)
    await logout()
  }

  // Build nav links, including Admin only for admins
  const links = isAdmin
    ? [...navLinks, { path: '/admin', label: 'Admin' }]
    : navLinks

  const handleLinkClick = () => {
    setIsMenuOpen(false)
  }

  return (
    <header className="panel mb-4 relative">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="text-lg font-medium hover:text-text">
          CARDS
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center gap-4">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-xs transition-colors ${
                location.pathname === link.path
                  ? 'text-text'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="btn-secondary text-xs ml-2">
            Logout
          </button>
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="sm:hidden p-3 -mr-3 text-text-muted hover:text-text transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? (
            // X icon
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            // Hamburger icon
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <nav className="sm:hidden mt-4 pt-4 border-t border-border flex flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={handleLinkClick}
              className={`py-3 px-2 text-base transition-colors ${
                location.pathname === link.path
                  ? 'text-text'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="py-3 px-2 text-base text-left text-text-muted hover:text-text transition-colors mt-2 pt-2 border-t border-border"
          >
            Logout
          </button>
        </nav>
      )}
    </header>
  )
}
