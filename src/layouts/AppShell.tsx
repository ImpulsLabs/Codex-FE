import { useEffect, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { logout } from '../features/auth/api/logout'

const MAIN_NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Articles', path: '/' },
  { label: 'Posts', path: '/posts' },
  { label: 'Categories', path: '/categories' },
  { label: 'Comments', path: '/comments' },
  { label: 'Users', path: '/users' },
  { label: 'Profile', path: '/profile' },
]

interface AppShellProps extends PropsWithChildren {
  contentClassName?: string
  contentMaxWidthClassName?: string
}

const LogoutIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
  </svg>
)

export const AppShell = ({ children, contentClassName, contentMaxWidthClassName = 'max-w-5xl' }: AppShellProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = MAIN_NAV_ITEMS.filter((item) => {
    if (!token) return item.path === '/'
    if (item.path === '/users') return user?.role === 'admin'
    return true
  })

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

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
      navigate('/login', { replace: true })
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-3 pb-10 pt-24 sm:px-6 lg:pt-32">
      <header className={`fixed left-1/2 top-3 z-50 w-[calc(100%-1rem)] max-w-5xl -translate-x-1/2 transition-all duration-300 sm:w-[calc(100%-2rem)] ${isScrolled ? 'lg:top-3' : 'lg:top-5'}`}>
        <nav className="rounded-[24px] border-[3px] border-white bg-white/90 px-2 py-2 shadow-[0px_20px_25px_-15px_rgba(15,23,42,0.15)] backdrop-blur-md lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-2 lg:rounded-[30px]">
          <div className="flex items-center justify-between gap-2 lg:contents">
            <Link to="/" className="shrink-0 rounded-[18px] px-3 py-2 text-sm font-black text-slate-900 lg:justify-self-start lg:rounded-[20px] lg:px-4 lg:py-2.5">
              ImpulsLabs
            </Link>

            <button
              type="button"
              onClick={() => setIsMenuOpen((current) => !current)}
              className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-slate-100 text-slate-800 transition-colors hover:bg-slate-200 lg:hidden"
              aria-label="Toggle navigation"
              aria-expanded={isMenuOpen}
            >
              <span className="flex w-5 flex-col gap-1.5">
                <span className="h-0.5 rounded-full bg-current" />
                <span className="h-0.5 rounded-full bg-current" />
                <span className="h-0.5 rounded-full bg-current" />
              </span>
            </button>
          </div>

          <div className="hidden items-center justify-center gap-1 lg:flex">
            {navItems.map((item) => {
              const isActive = item.path === '/'
                ? location.pathname === '/' || location.pathname.startsWith('/articles/')
                : location.pathname === item.path
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`shrink-0 rounded-[20px] px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
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

          <div className="hidden justify-self-end lg:block">
            {token ? (
              <button
                type="button"
                onClick={() => {
                  void handleLogout()
                }}
                disabled={isLoggingOut}
                className="mr-1 flex items-center gap-2 rounded-[20px] bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <LogoutIcon />
                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
            ) : (
              <div className="mr-1 flex items-center gap-1">
                <Link
                  to="/login"
                  className="rounded-[20px] px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-[20px] bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-800/20 transition-all duration-200 hover:bg-slate-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {isMenuOpen ? (
            <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 lg:hidden">
              {navItems.map((item) => {
                const isActive = item.path === '/'
                  ? location.pathname === '/' || location.pathname.startsWith('/articles/')
                  : location.pathname === item.path
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`rounded-[18px] px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-slate-800 text-white shadow-lg shadow-slate-800/20'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}

              {token ? (
                <button
                  type="button"
                  onClick={() => {
                    void handleLogout()
                  }}
                  disabled={isLoggingOut}
                  className="mt-2 flex items-center justify-center gap-2 rounded-[18px] bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <LogoutIcon />
                  <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                </button>
              ) : (
                <div className="mt-2 grid gap-2">
                  <Link
                    to="/login"
                    className="rounded-[18px] bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-[18px] bg-slate-900 px-4 py-3 text-center text-sm font-bold text-white transition-all hover:bg-slate-800"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          ) : null}
        </nav>
      </header>

      <section className={`mx-auto ${contentMaxWidthClassName} space-y-6 ${contentClassName ?? ''}`.trim()}>{children}</section>
    </main>
  )
}
