import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { AppShell } from '../../layouts/AppShell'
import api from '../../lib/axios'

const Icons = {
  Category: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
  ),
  Post: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
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
}

const formatDisplayName = (fullname?: string, username?: string, email?: string) => {
  if (fullname?.trim()) return fullname
  if (username?.trim()) return username
  if (email?.trim()) return email.split('@')[0]
  return 'Pengguna'
}

type ApiCategory = {
  id?: string | number
  name?: string
  slug?: string
  total_posts?: number | string
  posts_count?: number | string
}

type CategoryItem = {
  id: string
  name: string
  slug: string
  totalPosts: number
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const extractCategoryArray = (payload: unknown): ApiCategory[] => {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord) as ApiCategory[]
  }

  if (!isRecord(payload)) {
    return []
  }

  const directData = payload.data

  if (Array.isArray(directData)) {
    return directData.filter(isRecord) as ApiCategory[]
  }

  if (isRecord(directData) && Array.isArray(directData.data)) {
    return directData.data.filter(isRecord) as ApiCategory[]
  }

  return []
}

const mapApiCategory = (category: ApiCategory): CategoryItem => {
  const totalPosts = Number(category.total_posts ?? category.posts_count ?? 0)

  return {
    id: String(category.id ?? '-'),
    name: (category.name ?? 'Untitled Category').trim() || 'Untitled Category',
    slug: (category.slug ?? '').trim(),
    totalPosts: Number.isFinite(totalPosts) ? totalPosts : 0,
  }
}

const CategoriesPage = () => {
  const user = useAuthStore((state) => state.user)
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const displayName = useMemo(() => {
    return formatDisplayName(user?.fullname ?? user?.name, user?.username, user?.email)
  }, [user])

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { data } = await api.get('/v1/categories')
        setCategories(extractCategoryArray(data).map(mapApiCategory))
      } catch {
        setError('Gagal memuat data kategori dari server.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadCategories()
  }, [])

  const largestGroup = useMemo(() => {
    if (!categories.length) {
      return '-'
    }

    const sorted = [...categories].sort((a, b) => b.totalPosts - a.totalPosts)
    return sorted[0].name
  }, [categories])

  const totalPostsInCategories = useMemo(() => {
    return categories.reduce((sum, item) => sum + item.totalPosts, 0)
  }, [categories])

  return (
    <AppShell>
        <div className="rounded-[40px] border-[5px] border-white bg-gradient-to-b from-white to-slate-50 p-8 shadow-[0px_30px_30px_-20px_rgba(15,23,42,0.16)] sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Taxonomy Board</p>
              <h1 className="mt-2 text-3xl font-black text-slate-800">Kategori Konten</h1>
              <p className="mt-1 text-sm text-slate-500">Bangun struktur konten yang rapi dan mudah dinavigasi.</p>
            </div>
            <div className="rounded-[24px] border-2 border-white bg-white px-5 py-3 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.15)]">
              <p className="text-sm font-bold text-slate-800">{displayName}</p>
              <p className="text-xs text-slate-500">Category Manager</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <article className="rounded-[24px] border-2 border-white bg-white p-5 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Category</p>
              <p className="mt-2 text-4xl font-black text-slate-800">{categories.length}</p>
            </article>
            <article className="rounded-[24px] border-2 border-white bg-white p-5 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Largest Group</p>
              <p className="mt-2 text-2xl font-black text-slate-800">{largestGroup}</p>
            </article>
            <article className="rounded-[24px] border-2 border-white bg-white p-5 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Momentum</p>
              <p className="mt-2 text-2xl font-black text-emerald-600">{totalPostsInCategories} post</p>
            </article>
          </div>

          <div className="mt-8 rounded-[24px] border-2 border-white bg-white p-6 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Category List</h2>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-[16px] bg-slate-800 px-4 py-2.5 text-sm font-bold text-white shadow-[0px_10px_15px_-10px_rgba(15,23,42,0.4)]"
              >
                <Icons.Plus />
                New Category
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {isLoading ? (
                <p className="text-sm text-slate-500">Memuat kategori...</p>
              ) : null}

              {!isLoading && error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

              {!isLoading && !error && categories.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada kategori.</p>
              ) : null}

              {!isLoading && !error
                ? categories.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[20px] border-2 border-white bg-slate-50 p-4 transition-all duration-200 hover:bg-white hover:shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.12)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-[12px] bg-white p-2 text-slate-700 shadow-sm">
                        <Icons.Category />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{item.name}</p>
                        <p className="text-xs text-slate-500">/{item.slug}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700">{item.id}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-600">{item.totalPosts} posts</span>
                    <span className="font-semibold text-emerald-600">Aktif</span>
                  </div>
                </article>
                  ))
                : null}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Link
              to="/posts"
              className="flex items-center gap-3 rounded-[20px] border-2 border-white bg-slate-50 px-4 py-3 font-semibold text-slate-700 transition-all hover:bg-white hover:shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.12)]"
            >
              <Icons.Post />
              Lihat Daftar Post
            </Link>
            <Link
              to="/comments"
              className="flex items-center gap-3 rounded-[20px] border-2 border-white bg-slate-50 px-4 py-3 font-semibold text-slate-700 transition-all hover:bg-white hover:shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.12)]"
            >
              <Icons.Comment />
              Lanjut ke Moderasi Komentar
            </Link>
          </div>
        </div>
    </AppShell>
  )
}

export default CategoriesPage
