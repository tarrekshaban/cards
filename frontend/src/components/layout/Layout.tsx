import { ReactNode } from 'react'
import NavBar from './NavBar'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="page-shell">
      <div className="max-w-4xl mx-auto">
        <NavBar />
        {children}
      </div>
    </div>
  )
}
