import { useMemo, useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

// Icon components untuk visual yang lebih baik
const Icons = {
  Post: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Category: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
  Comment: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    </svg>
  ),
  Users: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Logout: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Plus: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  TrendUp: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Clock: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Alert: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Check: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

const formatDisplayName = (fullname?: string, username?: string, email?: string) => {
  if (fullname?.trim()) return fullname
  if (username?.trim()) return username
  if (email?.trim()) return email.split('@')[0]
  return 'Pengguna'
}

const DashboardPage = () => {
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const location = useLocation()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const displayName = useMemo(() => {
    return formatDisplayName(user?.fullname ?? user?.name, user?.username, user?.email)
  }, [user])

  const roleLabel = user?.role?.trim() ? user.role : 'user'

  const profileInitials = useMemo(() => {
    const source = displayName.trim()
    if (!source) return 'PG'
    const words = source.split(' ').filter(Boolean)
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
    return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase()
  }, [displayName])

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: Icons.Post },
    { label: 'Posts', path: '/posts', icon: Icons.Post },
    { label: 'Categories', path: '/categories', icon: Icons.Category },
    { label: 'Comments', path: '/comments', icon: Icons.Comment },
  ]

  const stats = [
    { 
      label: 'Posts Published', 
      value: '24', 
      meta: '+3 minggu ini',
      trend: 'up',
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50',
      icon: Icons.Post,
      progress: 75
    },
    { 
      label: 'Draft Active', 
      value: '7', 
      meta: 'Butuh finalisasi',
      trend: 'warning',
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50',
      icon: Icons.Post,
      progress: 45
    },
    { 
      label: 'Comments Pending', 
      value: '12', 
      meta: 'Perlu moderasi',
      trend: 'alert',
      color: 'from-rose-500 to-pink-600',
      bgColor: 'bg-rose-50',
      icon: Icons.Comment,
      progress: 60
    },
  ]

  const quickActions = [
    { 
      label: 'Kelola Post', 
      note: 'Tulis dan atur artikel baru', 
      path: '/posts',
      icon: Icons.Post,
      color: 'hover:border-blue-400 hover:shadow-blue-100'
    },
    { 
      label: 'Atur Kategori', 
      note: 'Organisasikan struktur konten', 
      path: '/categories',
      icon: Icons.Category,
      color: 'hover:border-purple-400 hover:shadow-purple-100'
    },
    { 
      label: 'Moderasi Komentar', 
      note: 'Jaga diskusi tetap sehat', 
      path: '/comments',
      icon: Icons.Comment,
      color: 'hover:border-rose-400 hover:shadow-rose-100'
    },
    { 
      label: 'Manajemen User', 
      note: 'Atur peran dan akses akun', 
      path: '/users',
      icon: Icons.Users,
      color: 'hover:border-emerald-400 hover:shadow-emerald-100'
    },
  ]

  const activities = [
    { time: '09:20', title: 'Draft baru ditambahkan', type: 'create', desc: 'Artikel "Tips SEO 2024" dibuat' },
    { time: '11:45', title: 'Komentar menunggu moderasi', type: 'warning', desc: '3 komentar spam terdeteksi' },
    { time: '14:10', title: 'Kategori konten diperbarui', type: 'update', desc: 'Tech Stack ditambahkan' },
    { time: '16:30', title: 'Post dipublikasikan', type: 'success', desc: '"React Best Practices" live' },
  ]

  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'create': return <div className="rounded-full bg-blue-100 p-2"><Icons.Plus /></div>
      case 'warning': return <div className="rounded-full bg-amber-100 p-2"><Icons.Alert /></div>
      case 'update': return <div className="rounded-full bg-purple-100 p-2"><Icons.Check /></div>
      case 'success': return <div className="rounded-full bg-emerald-100 p-2"><Icons.Check /></div>
      default: return <div className="rounded-full bg-slate-100 p-2"><Icons.Clock /></div>
    }
  }

  const getActivityColor = (type: string) => {
    switch(type) {
      case 'create': return 'border-blue-200 bg-blue-50/50'
      case 'warning': return 'border-amber-200 bg-amber-50/50'
      case 'update': return 'border-purple-200 bg-purple-50/50'
      case 'success': return 'border-emerald-200 bg-emerald-50/50'
      default: return 'border-slate-200 bg-slate-50'
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 px-4 pb-12 pt-28 sm:px-6 sm:pt-32">
      {/* Enhanced Background Effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl animate-pulse" />
        <div className="absolute -right-40 top-20 h-96 w-96 rounded-full bg-indigo-200/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-cyan-200/20 blur-3xl" />
        <div className="absolute right-1/4 top-1/2 h-64 w-64 rounded-full bg-violet-200/20 blur-3xl" />
      </div>

      {/* Glassmorphism Navigation */}
      <header className={`fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 transition-all duration-500 sm:w-[calc(100%-3rem)] ${isScrolled ? 'top-2' : 'top-4'}`}>
        <nav className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/60 bg-white/70 px-2 py-2 shadow-lg backdrop-blur-xl transition-all duration-300 ${isScrolled ? 'shadow-xl bg-white/85' : ''}`}>
          <div className="flex items-center gap-1 overflow-x-auto px-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`group relative flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                    isActive 
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <item.icon />
                  {item.label}
                  {isActive && (
                    <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 transition-opacity group-hover:opacity-100" />
                  )}
                </Link>
              )
            })}
          </div>
          
          <button
            type="button"
            onClick={clearAuth}
            className="group flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-600 transition-all duration-300 hover:bg-rose-100 hover:shadow-md hover:shadow-rose-200/50"
          >
            <Icons.Logout />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </nav>
      </header>

      {/* Main Content Container */}
      <section className="relative z-10 mx-auto w-full max-w-7xl space-y-6">
        
        {/* Welcome Header Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-xl sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/30" />
          
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Halo, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{displayName}</span>! 👋
              </h1>
              <p className="max-w-lg text-slate-600">
                Selamat datang kembali di dashboard. Anda memiliki <span className="font-semibold text-amber-600">7 tugas</span> yang menunggu hari ini.
              </p>
            </div>

            {/* Profile Card */}
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200/60 bg-white/80 p-4 shadow-lg shadow-slate-200/50 backdrop-blur-sm">
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-lg font-bold text-white shadow-lg">
                  {profileInitials}
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
                <span className="mt-1 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, idx) => (
            <article
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-slate-200/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.color}`} />
              
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-sm">
                    {stat.trend === 'up' && <Icons.TrendUp />}
                    {stat.trend === 'warning' && <Icons.Alert />}
                    {stat.trend === 'alert' && <Icons.Alert />}
                    <span className={`font-medium ${
                      stat.trend === 'up' ? 'text-emerald-600' : 
                      stat.trend === 'warning' ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {stat.meta}
                    </span>
                  </div>
                </div>
                <div className={`rounded-xl ${stat.bgColor} p-3 text-slate-700 transition-transform duration-300 group-hover:scale-110`}>
                  <stat.icon />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Progress</span>
                  <span>{stat.progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div 
                    className={`h-full rounded-full bg-gradient-to-r ${stat.color} transition-all duration-1000 ease-out`}
                    style={{ width: `${stat.progress}%` }}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Quick Actions - Takes 2 columns */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Akses Cepat</h2>
              <Link to="/posts/new" className="group flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20">
                <Icons.Plus />
                Post Baru
              </Link>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2">
              {quickActions.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`group relative overflow-hidden rounded-xl border border-slate-200/60 bg-white/80 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${item.color}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-slate-50 p-2.5 text-slate-600 transition-colors group-hover:bg-white group-hover:text-slate-900">
                      <item.icon />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{item.label}</h3>
                      <p className="mt-1 text-sm text-slate-500">{item.note}</p>
                    </div>
                    <svg className="h-5 w-5 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>

            {/* Recent Activity Timeline */}
            <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-slate-200/50 backdrop-blur-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Aktivitas Terbaru</h2>
              <div className="space-y-3">
                {activities.map((activity, idx) => (
                  <div key={idx} className={`flex items-start gap-4 rounded-xl border p-4 transition-all hover:shadow-md ${getActivityColor(activity.type)}`}>
                    <div className="mt-0.5 text-slate-600">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-slate-900">{activity.title}</p>
                        <span className="text-xs font-medium text-slate-400 whitespace-nowrap">{activity.time}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-0.5">{activity.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Sidebar - Session Info & Tips */}
          <aside className="space-y-6">
            {/* Session Info */}
            <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-slate-200/50 backdrop-blur-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Informasi Sesi</h2>
              <div className="space-y-3">
                <div className="rounded-xl bg-slate-50/80 p-4 border border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Role</p>
                  <span className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white uppercase tracking-wide">
                    {roleLabel}
                  </span>
                </div>
                
                <div className="rounded-xl bg-slate-50/80 p-4 border border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Username</p>
                  <p className="font-medium text-slate-900">{user?.username || '-'}</p>
                </div>
                
                <div className="rounded-xl bg-slate-50/80 p-4 border border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Email</p>
                  <p className="font-medium text-slate-900 break-all text-sm">{user?.email || '-'}</p>
                </div>

                <div className="rounded-xl bg-slate-50/80 p-4 border border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Waktu Login</p>
                  <p className="font-medium text-slate-900 text-sm">
                    {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 p-6 shadow-lg shadow-blue-100/50 backdrop-blur-sm">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tips Hari Ini
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Gunakan fitur <span className="font-semibold text-blue-700">scheduled post</span> untuk menjadwalkan publikasi artikel di waktu optimal pembaca Anda.
              </p>
              <button className="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-800 transition-colors">
                Pelajari lebih lanjut →
              </button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

export default DashboardPage