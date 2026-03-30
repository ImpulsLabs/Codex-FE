import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import type { QuickActionItem, StatItem } from './types'
import StatCard from './components/StatCard'
import QuickActionCard from './components/QuickActionCard'
import { AppShell } from '../../layouts/AppShell'

const IconImage = ({ src, className }: { src: string; className: string }) => (
  <img src={src} alt="" aria-hidden="true" className={className} />
)

const Icons = {
  Post: () => <IconImage src="/Icons/Posts.svg" className="h-5 w-5" />,
  Category: () => <IconImage src="/Icons/Category.svg" className="h-5 w-5" />,
  Comment: () => <IconImage src="/Icons/Comment.svg" className="h-5 w-5" />,
  Users: () => <IconImage src="/Icons/Users.svg" className="h-5 w-5" />,
  Plus: () => <IconImage src="/Icons/Plus.svg" className="h-5 w-5" />,
  Clock: () => <IconImage src="/Icons/Clock.svg" className="h-4 w-4" />,
  Analytics: () => <IconImage src="/Icons/Analytics.svg" className="h-5 w-5" />,
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