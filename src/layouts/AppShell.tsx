import { useEffect, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { logout } from '../features/auth/api/logout'

const MAIN_NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Posts', path: '/posts' },
  { label: 'Categories', path: '/categories' },
  { label: 'Comments', path: '/comments' },
]

interface AppShellProps extends PropsWithChildren {
  contentClassName?: string
}

const LogoutIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
  </svg>
)

export const AppShell = ({ children, contentClassName }: AppShellProps) => {
  const location = useLocation()
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    if (isLoggingOut) {
      return
    }

    setIsLoggingOut(true)

    try {
      await logout()
    } catch {
      // Clear local session even if backend logout fails.
    } finally {
      clearAuth()
      setIsLoggingOut(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-12 pt-28 sm:px-6 sm:pt-32">
      <header className={`fixed left-1/2 top-5 z-50 w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 transition-all duration-300 ${isScrolled ? 'top-3' : 'top-5'}`}>
        <nav className="flex items-center justify-between rounded-[30px] border-[3px] border-white bg-white/90 px-2 py-2 shadow-[0px_20px_25px_-15px_rgba(15,23,42,0.15)] backdrop-blur-md">
          <div className="flex items-center gap-1 px-1">
            {MAIN_NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`rounded-[20px] px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-lg shadow-slate-800/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              void handleLogout()
            }}
            disabled={isLoggingOut}
            className="mr-1 flex items-center gap-2 rounded-[20px] bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LogoutIcon />
            <span className="hidden sm:inline">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        </nav>
      </header>

      <section className={`mx-auto max-w-5xl space-y-6 ${contentClassName ?? ''}`.trim()}>{children}</section>
    </main>
  )
}
