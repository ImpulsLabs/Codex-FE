import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import type { QuickActionItem, StatItem } from './types'
import StatCard from './components/StatCard'
import QuickActionCard from './components/QuickActionCard'
import { AppShell } from '../../layouts/AppShell'

const Icons = {
  Post: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  Category: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
  ),
  Comment: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
    </svg>
  ),
  Users: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  Logout: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  ),
  Plus: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  Clock: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Analytics: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7.5 15l3-3 2.5 2.5 4.5-5" />
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

  const stats: StatItem[] = [
    { label: 'Published', value: '24', sub: '+3 minggu ini' },
    { label: 'Drafts', value: '7', sub: 'Active' },
    { label: 'Pending', value: '12', sub: 'Comments' },
    { label: 'Scheduled', value: '5', sub: 'Next 7 days' },
  ]

  const quickActions: QuickActionItem[] = [
    { label: 'Kelola Post', path: '/posts', icon: Icons.Post },
    { label: 'Atur Kategori', path: '/categories', icon: Icons.Category },
    { label: 'Moderasi', path: '/comments', icon: Icons.Comment },
    { label: 'Users', path: '/users', icon: Icons.Users },
    { label: 'Analytics', path: '/dashboard', icon: Icons.Analytics },
  ]

  return (
    <AppShell>
        
        {/* Main Card Container - Consistent dengan Register Form */}
        <div className="rounded-[40px] border-[5px] border-white bg-gradient-to-b from-white to-slate-50 p-8 shadow-[0px_30px_30px_-20px_rgba(15,23,42,0.16)] sm:p-10">
          
          {/* Header Section */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Dashboard</p>
              <h1 className="mt-2 text-3xl font-black text-slate-800">
                Welcome Back!, {displayName}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Ringkasan aktivitas konten Anda
              </p>
            </div>

            {/* Profile Badge */}
            <div className="flex items-center gap-4 rounded-[24px] border-2 border-white bg-white px-5 py-3 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.15)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-slate-800 text-sm font-bold text-white">
                {profileInitials}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{displayName}</p>
                <p className="text-xs text-slate-500">{roleLabel}</p>
              </div>
            </div>
          </div>

          {/* Stats Grid - Minimalist Cards */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} item={stat} />
            ))}
          </div>

          {/* Content Grid */}
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            
            {/* Quick Actions - 2 Columns */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Akses Cepat</h2>
                <Link 
                  to="/posts/new"
                  className="flex items-center gap-2 rounded-[16px] bg-slate-800 px-4 py-2 text-sm font-bold text-white shadow-[0px_10px_15px_-10px_rgba(15,23,42,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0px_15px_20px_-12px_rgba(15,23,42,0.5)] active:scale-95"
                >
                  <Icons.Plus />
                  Baru
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {quickActions.map((item) => (
                  <QuickActionCard key={item.label} item={item} />
                ))}
              </div>

              {/* Recent Activity - Simplified */}
              <div className="mt-6 rounded-[24px] border-2 border-white bg-white p-6 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Aktivitas Terbaru</h3>
                <div className="mt-4 space-y-3">
                  {[
                    { time: '09:20', text: 'Draft baru ditambahkan' },
                    { time: '11:45', text: 'Komentar menunggu moderasi' },
                    { time: '14:10', text: 'Kategori diperbarui' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 rounded-[16px] bg-slate-50 px-4 py-3">
                      <span className="text-xs font-bold text-slate-400">{item.time}</span>
                      <span className="text-sm font-medium text-slate-700">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Info - 1 Column */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800">Informasi</h2>
              
              <div className="rounded-[24px] border-2 border-white bg-white p-6 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
                <div className="space-y-4">
                  <div className="rounded-[16px] bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Role</p>
                    <p className="mt-1 text-sm font-bold text-slate-800 uppercase">{roleLabel}</p>
                  </div>
                  
                  <div className="rounded-[16px] bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Username</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{user?.username || '-'}</p>
                  </div>
                  
                  <div className="rounded-[16px] bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Email</p>
                    <p className="mt-1 break-all text-sm font-semibold text-slate-800">{user?.email || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Time Widget */}
              <div className="rounded-[24px] border-2 border-white bg-slate-800 p-6 text-white shadow-[0px_15px_30px_-10px_rgba(15,23,42,0.4)]">
                <div className="flex items-center gap-3 text-slate-300">
                  <Icons.Clock />
                  <span className="text-xs font-bold uppercase tracking-wider">Sesi Aktif</span>
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>
    </AppShell>
  )
}

export default DashboardPage