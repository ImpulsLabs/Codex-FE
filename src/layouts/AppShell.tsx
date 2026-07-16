import { useEffect, useState } from 'react'
import type { PropsWithChildren } from 'react'
import {
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MessageSquareText,
  Newspaper,
  UserRound,
  UserRoundPlus,
  Users,
  X,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { logout } from '../features/auth/api/logout'

const MAIN_NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Articles', path: '/', icon: Newspaper },
  { label: 'Posts', path: '/posts', icon: FileText },
  { label: 'Categories', path: '/categories', icon: FolderOpen },
  { label: 'Comments', path: '/comments', icon: MessageSquareText },
  { label: 'Users', path: '/users', icon: Users },
  { label: 'Profile', path: '/profile', icon: UserRound },
]

interface AppShellProps extends PropsWithChildren {
  contentClassName?: string
  contentMaxWidthClassName?: string
}

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
      void 0
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
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          <div className="hidden items-center justify-center gap-1 lg:flex">
            {navItems.map((item) => {
              const isActive = item.path === '/'
                ? location.pathname === '/' || location.pathname.startsWith('/articles/')
                : location.pathname === item.path
              const Icon = item.icon

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-[20px] px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-lg shadow-slate-800/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
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
                className="mr-1 inline-flex items-center gap-2 rounded-[20px] bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <LogOut className="h-4 w-4" />
                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
            ) : (
              <div className="mr-1 flex items-center gap-1">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-[20px] px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-[20px] bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-800/20 transition-all duration-200 hover:bg-slate-700"
                >
                  <UserRoundPlus className="h-4 w-4" />
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
                const Icon = item.icon

                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`inline-flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-slate-800 text-white shadow-lg shadow-slate-800/20'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
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
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-[18px] bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                </button>
              ) : (
                <div className="mt-2 grid gap-2">
                  <Link
                    to="/login"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100"
                  >
                    <LogIn className="h-4 w-4" />
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800"
                  >
                    <UserRoundPlus className="h-4 w-4" />
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
