import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { AppShell } from '../../layouts/AppShell'
import api from '../../lib/axios'

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
  Plus: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  Search: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m0 0A7.5 7.5 0 105.65 5.65a7.5 7.5 0 0010.6 10.6z" />
    </svg>
  ),
}

const formatDisplayName = (fullname?: string, username?: string, email?: string) => {
  if (fullname?.trim()) return fullname
  if (username?.trim()) return username
  if (email?.trim()) return email.split('@')[0]
  return 'Pengguna'
}

type ApiPost = {
  id?: string | number
  title?: string
  name?: string
  category?: string | { name?: string }
  category_name?: string
  status?: string
  views?: number | string
  view_count?: number | string
  created_at?: string
  published_at?: string
}

type ApiPostsResponse = {
  data?: unknown
}

type PostRow = {
  id: string
  title: string
  category: string
  status: string
  views: number
  date: string
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const toStatusLabel = (status?: string) => {
  if (!status) {
    return 'Draft'
  }

  const normalized = status.trim().toLowerCase()

  if (['published', 'publish'].includes(normalized)) return 'Published'
  if (['review', 'pending', 'pending_review'].includes(normalized)) return 'Review'
  if (['draft'].includes(normalized)) return 'Draft'
  return status
}

const formatPostDate = (value?: string) => {
  if (!value) {
    return '-'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const extractPostArray = (payload: unknown): ApiPost[] => {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord) as ApiPost[]
  }

  if (!isRecord(payload)) {
    return []
  }

  const directData = payload.data

  if (Array.isArray(directData)) {
    return directData.filter(isRecord) as ApiPost[]
  }

  if (isRecord(directData) && Array.isArray(directData.data)) {
    return directData.data.filter(isRecord) as ApiPost[]
  }

  return []
}

const mapApiPostToRow = (post: ApiPost): PostRow => {
  const id = String(post.id ?? '-')
  const title = (post.title ?? post.name ?? 'Untitled').trim() || 'Untitled'
  const category =
    (typeof post.category === 'string' ? post.category : post.category?.name) ??
    post.category_name ??
    '-'

  const parsedViews = Number(post.views ?? post.view_count ?? 0)

  return {
    id,
    title,
    category,
    status: toStatusLabel(post.status),
    views: Number.isFinite(parsedViews) ? parsedViews : 0,
    date: formatPostDate(post.published_at ?? post.created_at),
  }
}

const PostsPage = () => {
  const user = useAuthStore((state) => state.user)
  const [posts, setPosts] = useState<PostRow[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const displayName = useMemo(() => {
    return formatDisplayName(user?.fullname ?? user?.name, user?.username, user?.email)
  }, [user])

  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { data } = await api.get<ApiPostsResponse | ApiPost[]>('/v1/posts')
        const mappedPosts = extractPostArray(data).map(mapApiPostToRow)
        setPosts(mappedPosts)
      } catch {
        setError('Gagal memuat data post dari server.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadPosts()
  }, [])

  const filteredPosts = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) {
      return posts
    }

    return posts.filter((post) => {
      return post.title.toLowerCase().includes(keyword) || post.category.toLowerCase().includes(keyword)
    })
  }, [posts, search])

  const publishedCount = useMemo(() => {
    return posts.filter((post) => post.status === 'Published').length
  }, [posts])

  const reviewCount = useMemo(() => {
    return posts.filter((post) => post.status === 'Review').length
  }, [posts])

  const getStatusClasses = (status: string) => {
    if (status === 'Published') return 'bg-emerald-100 text-emerald-700'
    if (status === 'Review') return 'bg-amber-100 text-amber-700'
    return 'bg-slate-200 text-slate-700'
  }

  return (
    <AppShell>
        <div className="rounded-[40px] border-[5px] border-white bg-gradient-to-b from-white to-slate-50 p-8 shadow-[0px_30px_30px_-20px_rgba(15,23,42,0.16)] sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Content Studio</p>
              <h1 className="mt-2 text-3xl font-black text-slate-800">Daftar Post</h1>
              <p className="mt-1 text-sm text-slate-500">Kelola artikel, status editorial, dan performa konten.</p>
            </div>

            <div className="flex items-center gap-4 rounded-[24px] border-2 border-white bg-white px-5 py-3 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.15)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-slate-800 text-sm font-bold text-white">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{displayName}</p>
                <p className="text-xs text-slate-500">Editor Session</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <article className="rounded-[24px] border-2 border-white bg-white p-5 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Posts</p>
              <p className="mt-2 text-4xl font-black text-slate-800">{posts.length}</p>
            </article>
            <article className="rounded-[24px] border-2 border-white bg-white p-5 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Published</p>
              <p className="mt-2 text-4xl font-black text-slate-800">{publishedCount}</p>
            </article>
            <article className="rounded-[24px] border-2 border-white bg-white p-5 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Need Review</p>
              <p className="mt-2 text-4xl font-black text-slate-800">{reviewCount}</p>
            </article>
          </div>

          <div className="mt-8 rounded-[24px] border-2 border-white bg-white p-5 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)] sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex w-full items-center gap-2 rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 sm:max-w-sm">
                <Icons.Search />
                <input
                  type="text"
                  placeholder="Cari judul post..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full border-none bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
                />
              </label>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-slate-800 px-4 py-2.5 text-sm font-bold text-white shadow-[0px_10px_15px_-10px_rgba(15,23,42,0.4)] transition-all hover:scale-[1.02]"
              >
                <Icons.Plus />
                New Post
              </button>
            </div>

            <div className="overflow-x-auto rounded-[18px] border border-slate-100">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Views</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                        Memuat data post...
                      </td>
                    </tr>
                  ) : null}

                  {!isLoading && error ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm font-semibold text-rose-600">
                        {error}
                      </td>
                    </tr>
                  ) : null}

                  {!isLoading && !error && filteredPosts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                        Data post tidak ditemukan.
                      </td>
                    </tr>
                  ) : null}

                  {!isLoading && !error
                    ? filteredPosts.map((post) => (
                    <tr key={post.id} className="border-t border-slate-100 bg-white transition-colors hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-semibold text-slate-500">{post.id}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{post.title}</td>
                      <td className="px-4 py-3 text-slate-600">{post.category}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusClasses(post.status)}`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{post.views.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-slate-600">{post.date}</td>
                    </tr>
                      ))
                    : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 rounded-[20px] border-2 border-white bg-slate-50 px-4 py-3 font-semibold text-slate-700 transition-all hover:bg-white hover:shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.12)]"
            >
              <Icons.Post />
              Kembali ke Dashboard
            </Link>
            <Link
              to="/categories"
              className="flex items-center gap-3 rounded-[20px] border-2 border-white bg-slate-50 px-4 py-3 font-semibold text-slate-700 transition-all hover:bg-white hover:shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.12)]"
            >
              <Icons.Category />
              Lanjut ke Categories
            </Link>
          </div>
        </div>
    </AppShell>
  )
}

export default PostsPage
