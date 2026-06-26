import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import type { QuickActionItem, StatItem } from './types'
import StatCard from './components/StatCard'
import QuickActionCard from './components/QuickActionCard'
import { AppShell } from '../../layouts/AppShell'
import api from '../../lib/axios'

const IconImage = ({ src, className }: { src: string; className: string }) => (
  <img src={src} alt="" aria-hidden="true" className={className} />
)

const Icons = {
  Post: () => <IconImage src="/Icons/Posts.svg" className="h-5 w-5" />,
  Category: () => <IconImage src="/Icons/Category.svg" className="h-5 w-5" />,
  Comment: () => <IconImage src="/Icons/Comment.svg" className="h-5 w-5" />,
  Users: () => <IconImage src="/Icons/Users.svg" className="h-5 w-5" />,
  Plus: () => (
    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  Clock: () => <IconImage src="/Icons/Clock.svg" className="h-4 w-4" />,
}

type ApiPost = {
  id?: string | number
  title?: string
  status?: string
  created_at?: string
}

type ApiCategory = {
  id?: string | number
}

type ApiComment = {
  id?: string | number
}

type ApiUser = {
  id?: string | number
}

type DashboardData = {
  posts: ApiPost[]
  categories: ApiCategory[]
  comments: ApiComment[]
  users: ApiUser[]
}

const formatDisplayName = (fullname?: string, username?: string, email?: string) => {
  if (fullname?.trim()) return fullname
  if (username?.trim()) return username
  if (email?.trim()) return email.split('@')[0]
  return 'Pengguna'
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const extractArray = <T,>(payload: unknown, keys: string[]): T[] => {
  if (Array.isArray(payload)) return payload.filter(isRecord) as T[]
  if (!isRecord(payload)) return []

  for (const key of keys) {
    const value = payload[key]

    if (Array.isArray(value)) return value.filter(isRecord) as T[]

    if (isRecord(value) && Array.isArray(value.data)) {
      return value.data.filter(isRecord) as T[]
    }
  }

  if (Array.isArray(payload.data)) return payload.data.filter(isRecord) as T[]
  if (isRecord(payload.data) && Array.isArray(payload.data.data)) {
    return payload.data.data.filter(isRecord) as T[]
  }

  return []
}

const formatPostDate = (value?: string) => {
  if (!value) return '-'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return parsed.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const DashboardPage = () => {
  const user = useAuthStore((state) => state.user)
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    posts: [],
    categories: [],
    comments: [],
    users: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const roleLabel = user?.role?.trim().toLowerCase() || 'author'
  const isAdmin = roleLabel === 'admin'

  const displayName = useMemo(() => {
    return formatDisplayName(user?.fullname ?? user?.name, user?.username, user?.email)
  }, [user])

  const profileInitials = useMemo(() => {
    const source = displayName.trim()
    if (!source) return 'PG'
    const words = source.split(' ').filter(Boolean)
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
    return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase()
  }, [displayName])

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true)
      setError(null)

      const requests = [
        api.get('/v1/posts', { params: { limit: 50, page: 1 } }),
        api.get('/v1/categories'),
        api.get('/v1/comments'),
      ]

      if (isAdmin) {
        requests.push(api.get('/v1/users'))
      }

      const results = await Promise.allSettled(requests)

      const [postsResult, categoriesResult, commentsResult, usersResult] = results

      setDashboardData({
        posts: postsResult.status === 'fulfilled' ? extractArray<ApiPost>(postsResult.value.data, ['articles', 'posts']) : [],
        categories:
          categoriesResult.status === 'fulfilled'
            ? extractArray<ApiCategory>(categoriesResult.value.data, ['categories'])
            : [],
        comments:
          commentsResult.status === 'fulfilled'
            ? extractArray<ApiComment>(commentsResult.value.data, ['comments', 'categories'])
            : [],
        users:
          isAdmin && usersResult?.status === 'fulfilled'
            ? extractArray<ApiUser>(usersResult.value.data, ['users', 'categories'])
            : [],
      })

      if (results.some((result) => result.status === 'rejected')) {
        setError('Sebagian data dashboard gagal dimuat.')
      }

      setIsLoading(false)
    }

    void loadDashboard()
  }, [isAdmin])

  const publishedCount = useMemo(() => {
    return dashboardData.posts.filter((post) => post.status?.toLowerCase() === 'published').length
  }, [dashboardData.posts])

  const draftCount = useMemo(() => {
    return dashboardData.posts.filter((post) => post.status?.toLowerCase() === 'draft').length
  }, [dashboardData.posts])

  const stats: StatItem[] = useMemo(() => {
    const baseStats: StatItem[] = [
      { label: 'Posts', value: String(dashboardData.posts.length), sub: `${publishedCount} published` },
      { label: 'Drafts', value: String(draftCount), sub: 'Belum tampil publik' },
      { label: 'Categories', value: String(dashboardData.categories.length), sub: 'Taksonomi konten' },
      { label: 'Comments', value: String(dashboardData.comments.length), sub: 'Masuk ke artikel' },
    ]

    if (isAdmin) {
      return [
        baseStats[0],
        baseStats[2],
        baseStats[3],
        { label: 'Users', value: String(dashboardData.users.length), sub: 'Admin dan author' },
      ]
    }

    return baseStats
  }, [dashboardData.categories.length, dashboardData.comments.length, dashboardData.posts.length, dashboardData.users.length, draftCount, isAdmin, publishedCount])

  const quickActions: QuickActionItem[] = useMemo(() => {
    const actions: QuickActionItem[] = [
      { label: 'Kelola Post', path: '/posts', icon: Icons.Post },
      { label: 'Atur Kategori', path: '/categories', icon: Icons.Category },
      { label: 'Moderasi Komentar', path: '/comments', icon: Icons.Comment },
    ]

    if (isAdmin) {
      actions.push({ label: 'Kelola Users', path: '/users', icon: Icons.Users })
    }

    return actions
  }, [isAdmin])

  const recentPosts = useMemo(() => {
    return [...dashboardData.posts]
      .sort((a, b) => new Date(b.created_at ?? '').getTime() - new Date(a.created_at ?? '').getTime())
      .slice(0, 3)
  }, [dashboardData.posts])

  return (
    <AppShell>
      <div className="rounded-[40px] border-[5px] border-white bg-gradient-to-b from-white to-slate-50 p-8 shadow-[0px_30px_30px_-20px_rgba(15,23,42,0.16)] sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Dashboard</p>
            <h1 className="mt-2 text-3xl font-black text-slate-800">Welcome Back!, {displayName}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {isAdmin ? 'Ringkasan seluruh aktivitas konten dan pengguna.' : 'Ringkasan aktivitas konten milik Anda.'}
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-[24px] border-2 border-white bg-white px-5 py-3 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.15)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-slate-800 text-sm font-bold text-white">
              {profileInitials}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{displayName}</p>
              <p className="text-xs uppercase text-slate-500">{roleLabel}</p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-[20px] bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            {error}
          </div>
        ) : null}

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? stats.map((stat) => <StatCard key={stat.label} item={{ ...stat, value: '...' }} />)
            : stats.map((stat) => <StatCard key={stat.label} item={stat} />)}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Akses Cepat</h2>
              <Link
                to="/posts"
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

            <div className="mt-6 rounded-[24px] border-2 border-white bg-white p-6 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Post Terbaru</h3>
              <div className="mt-4 space-y-3">
                {recentPosts.length > 0 ? (
                  recentPosts.map((post) => (
                    <div key={post.id ?? post.title} className="flex items-center gap-4 rounded-[16px] bg-slate-50 px-4 py-3">
                      <span className="text-xs font-bold text-slate-400">{formatPostDate(post.created_at)}</span>
                      <span className="text-sm font-medium text-slate-700">{post.title ?? 'Untitled post'}</span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-[16px] bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
                    Belum ada post yang bisa ditampilkan.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Informasi</h2>

            <div className="rounded-[24px] border-2 border-white bg-white p-6 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
              <div className="space-y-4">
                <div className="rounded-[16px] bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Role</p>
                  <p className="mt-1 text-sm font-bold uppercase text-slate-800">{roleLabel}</p>
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
