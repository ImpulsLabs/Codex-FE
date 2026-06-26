import { useCallback, useEffect, useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { AppShell } from '../../layouts/AppShell'
import api from '../../lib/axios'

const Icons = {
  Post: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  Category: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
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

type ApiUser = {
  username?: string
  fullname?: string
  email?: string
}

type ApiCategory = {
  id: number
  name: string
  slug: string
}

type ApiPost = {
  id: number
  title: string
  slug: string
  content: string
  description?: string | null
  status?: string
  thumbnail?: string | null
  category_id?: number | null
  created_at?: string
  category?: ApiCategory | null
  user?: ApiUser | null
}

type PostsPaginator = {
  data: ApiPost[]
  current_page: number
  last_page: number
  total: number
  from: number | null
  to: number | null
}

type PostsResponse = {
  message: string
  articles: PostsPaginator
}

type CategoriesResponse = {
  categories?: ApiCategory[]
  data?: ApiCategory[]
}

type ApiErrorPayload = {
  message?: string
  errors?: Record<string, string[]>
}

type PostFormState = {
  id?: number
  title: string
  slug: string
  description: string
  content: string
  categoryId: string
  status: 'published' | 'draft'
  thumbnail: File | null
}

const emptyForm: PostFormState = {
  title: '',
  slug: '',
  description: '',
  content: '',
  categoryId: '',
  status: 'published',
  thumbnail: null,
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

const extractCategories = (payload: unknown): ApiCategory[] => {
  if (Array.isArray(payload)) return payload.filter(isRecord) as ApiCategory[]
  if (!isRecord(payload)) return []

  if (Array.isArray(payload.categories)) return payload.categories.filter(isRecord) as ApiCategory[]
  if (Array.isArray(payload.data)) return payload.data.filter(isRecord) as ApiCategory[]

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

const toStatusLabel = (status?: string) => {
  return status?.toLowerCase() === 'draft' ? 'Draft' : 'Published'
}

const getStatusClasses = (status?: string) => {
  if (status?.toLowerCase() === 'published') return 'bg-emerald-100 text-emerald-700'
  return 'bg-slate-200 text-slate-700'
}

const slugify = (value: string) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s.-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const resolveErrorMessage = (error: unknown) => {
  if (isAxiosError<ApiErrorPayload>(error)) {
    const responseData = error.response?.data

    if (responseData?.errors) {
      const firstError = Object.values(responseData.errors)[0]?.[0]
      if (firstError) return firstError
    }

    if (responseData?.message) return responseData.message
  }

  return 'Request gagal diproses.'
}

const buildPostFormData = (form: PostFormState) => {
  const formData = new FormData()
  formData.append('title', form.title.trim())
  formData.append('slug', form.slug.trim())
  formData.append('content', form.content.trim())
  formData.append('description', form.description.trim())
  formData.append('status', form.status)

  if (form.categoryId) {
    formData.append('category_id', form.categoryId)
  }

  if (form.thumbnail) {
    formData.append('thumbnail', form.thumbnail)
  }

  return formData
}

const mapPostToForm = (post: ApiPost): PostFormState => ({
  id: post.id,
  title: post.title ?? '',
  slug: post.slug ?? '',
  description: post.description ?? '',
  content: post.content ?? '',
  categoryId: post.category_id ? String(post.category_id) : post.category?.id ? String(post.category.id) : '',
  status: post.status?.toLowerCase() === 'draft' ? 'draft' : 'published',
  thumbnail: null,
})

const PostsPage = () => {
  const user = useAuthStore((state) => state.user)
  const [posts, setPosts] = useState<ApiPost[]>([])
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [lastPage, setLastPage] = useState(1)
  const [rangeText, setRangeText] = useState('0 post')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<PostFormState>(emptyForm)
  const [reloadKey, setReloadKey] = useState(0)

  const displayName = useMemo(() => {
    return formatDisplayName(user?.fullname ?? user?.name, user?.username, user?.email)
  }, [user])

  const loadPosts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data } = await api.get<PostsResponse>('/v1/posts', {
        params: {
          search,
          limit,
          page,
        },
      })

      setPosts(data.articles.data)
      setLastPage(data.articles.last_page || 1)
      setRangeText(
        data.articles.from && data.articles.to
          ? `${data.articles.from}-${data.articles.to} dari ${data.articles.total} post`
          : `${data.articles.total} post`,
      )
    } catch {
      setPosts([])
      setError('Gagal memuat data post dari server.')
    } finally {
      setIsLoading(false)
    }
  }, [limit, page, search])

  useEffect(() => {
    void loadPosts()
  }, [loadPosts, reloadKey])

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await api.get<CategoriesResponse>('/v1/categories')
        setCategories(extractCategories(data))
      } catch {
        setCategories([])
      }
    }

    void loadCategories()
  }, [])

  const publishedCount = useMemo(() => {
    return posts.filter((post) => post.status?.toLowerCase() === 'published').length
  }, [posts])

  const draftCount = useMemo(() => {
    return posts.filter((post) => post.status?.toLowerCase() === 'draft').length
  }, [posts])

  const openCreateModal = () => {
    setForm(emptyForm)
    setFormError(null)
    setSuccess(null)
    setIsModalOpen(true)
  }

  const openEditModal = (post: ApiPost) => {
    setForm(mapPostToForm(post))
    setFormError(null)
    setSuccess(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (isSaving) return
    setIsModalOpen(false)
    setForm(emptyForm)
    setFormError(null)
  }

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  const handleTitleChange = (value: string) => {
    setForm((current) => ({
      ...current,
      title: value,
      slug: current.id ? current.slug : slugify(value),
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setFormError(null)
    setSuccess(null)

    try {
      if (form.id) {
        await api.post(`/v1/posts/${form.id}`, buildPostFormData(form), {
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        })
        setSuccess('Post berhasil diperbarui.')
      } else {
        await api.post('/v1/posts', buildPostFormData(form), {
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        })
        setSuccess('Post berhasil dibuat.')
      }

      setIsModalOpen(false)
      setForm(emptyForm)
      setReloadKey((current) => current + 1)
    } catch (requestError) {
      setFormError(resolveErrorMessage(requestError))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (post: ApiPost) => {
    const confirmed = window.confirm(`Hapus post "${post.title}"?`)
    if (!confirmed) return

    setIsDeletingId(post.id)
    setError(null)
    setSuccess(null)

    try {
      await api.delete(`/v1/posts/${post.id}`)
      setSuccess('Post berhasil dihapus.')
      setReloadKey((current) => current + 1)
    } catch (requestError) {
      setError(resolveErrorMessage(requestError))
    } finally {
      setIsDeletingId(null)
    }
  }

  return (
    <AppShell>
      <div className="rounded-[40px] border-[5px] border-white bg-gradient-to-b from-white to-slate-50 p-8 shadow-[0px_30px_30px_-20px_rgba(15,23,42,0.16)] sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Content Studio</p>
            <h1 className="mt-2 text-3xl font-black text-slate-800">Daftar Post</h1>
            <p className="mt-1 text-sm text-slate-500">Kelola artikel, status editorial, dan publikasi konten.</p>
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
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loaded Posts</p>
            <p className="mt-2 text-4xl font-black text-slate-800">{posts.length}</p>
          </article>
          <article className="rounded-[24px] border-2 border-white bg-white p-5 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Published</p>
            <p className="mt-2 text-4xl font-black text-slate-800">{publishedCount}</p>
          </article>
          <article className="rounded-[24px] border-2 border-white bg-white p-5 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Draft</p>
            <p className="mt-2 text-4xl font-black text-slate-800">{draftCount}</p>
          </article>
        </div>

        {success ? (
          <div className="mt-6 rounded-[20px] bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="mt-8 rounded-[24px] border-2 border-white bg-white p-5 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)] sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <form onSubmit={handleSearchSubmit} className="flex w-full gap-2 sm:max-w-lg">
              <label className="flex min-w-0 flex-1 items-center gap-2 rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
                <Icons.Search />
                <input
                  type="search"
                  placeholder="Cari judul post..."
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className="w-full border-none bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
                />
              </label>
              {searchInput || search ? (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="rounded-[16px] border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100"
                >
                  Reset
                </button>
              ) : null}
              <button
                type="submit"
                className="rounded-[16px] bg-slate-800 px-4 py-2.5 text-sm font-bold text-white shadow-[0px_10px_15px_-10px_rgba(15,23,42,0.4)] transition-all hover:scale-[1.02]"
              >
                Cari
              </button>
            </form>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-slate-800 px-4 py-2.5 text-sm font-bold text-white shadow-[0px_10px_15px_-10px_rgba(15,23,42,0.4)] transition-all hover:scale-[1.02]"
            >
              <Icons.Plus />
              New Post
            </button>
          </div>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-600">{isLoading ? 'Memuat data post...' : rangeText}</p>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              Tampilkan
              <select
                value={limit}
                onChange={(event) => {
                  setPage(1)
                  setLimit(Number(event.target.value))
                }}
                className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </label>
          </div>

          {error ? <p className="mb-4 text-sm font-semibold text-rose-600">{error}</p> : null}

          <div className="overflow-x-auto rounded-[18px] border border-slate-100">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
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

                {!isLoading && !error && posts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                      Data post tidak ditemukan.
                    </td>
                  </tr>
                ) : null}

                {!isLoading
                  ? posts.map((post) => (
                      <tr key={post.id} className="border-t border-slate-100 bg-white transition-colors hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-semibold text-slate-500">{post.id}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">{post.title}</p>
                          <p className="text-xs text-slate-500">/{post.slug}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{post.category?.name ?? '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusClasses(post.status)}`}>
                            {toStatusLabel(post.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatPostDate(post.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(post)}
                              className="rounded-[14px] bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                void handleDelete(post)
                              }}
                              disabled={isDeletingId === post.id}
                              className="rounded-[14px] bg-rose-100 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {isDeletingId === post.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>

          {!isLoading && lastPage > 1 ? (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="rounded-[16px] border-2 border-white bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <p className="text-center text-sm font-bold text-slate-500">
                Halaman {page} dari {lastPage}
              </p>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(lastPage, current + 1))}
                disabled={page >= lastPage}
                className="rounded-[16px] border-2 border-white bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Berikutnya
              </button>
            </div>
          ) : null}
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

      {isModalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/40 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[32px] border-[5px] border-white bg-gradient-to-b from-white to-slate-50 p-6 shadow-[0px_30px_30px_-20px_rgba(15,23,42,0.32)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  {form.id ? 'Edit Post' : 'Create Post'}
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-800">
                  {form.id ? 'Update artikel' : 'Post baru'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-[16px] bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  <span>Title</span>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) => handleTitleChange(event.target.value)}
                    className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                    required
                    disabled={isSaving}
                  />
                </label>

                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  <span>Slug</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))}
                    className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                    required
                    disabled={isSaving}
                  />
                </label>
              </div>

              <label className="block space-y-2 text-sm font-semibold text-slate-700">
                <span>Description</span>
                <input
                  type="text"
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                  maxLength={255}
                  disabled={isSaving}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-2 text-sm font-semibold text-slate-700 sm:col-span-2">
                  <span>Category</span>
                  <select
                    value={form.categoryId}
                    onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
                    className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                    disabled={isSaving}
                  >
                    <option value="">Tanpa kategori</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  <span>Status</span>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, status: event.target.value as PostFormState['status'] }))
                    }
                    className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                    disabled={isSaving}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-2 text-sm font-semibold text-slate-700">
                <span>Thumbnail</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => setForm((current) => ({ ...current, thumbnail: event.target.files?.[0] ?? null }))}
                  className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none file:mr-4 file:rounded-[12px] file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sm file:font-bold file:text-white"
                  disabled={isSaving}
                />
              </label>

              <label className="block space-y-2 text-sm font-semibold text-slate-700">
                <span>Content</span>
                <textarea
                  value={form.content}
                  onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                  className="min-h-48 w-full resize-y rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-slate-400"
                  required
                  disabled={isSaving}
                />
              </label>

              {formError ? <p className="text-sm font-semibold text-rose-600">{formError}</p> : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-[16px] bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
                  disabled={isSaving}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-[16px] bg-slate-800 px-4 py-2.5 text-sm font-bold text-white shadow-[0px_10px_15px_-10px_rgba(15,23,42,0.4)] transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSaving}
                >
                  {isSaving ? 'Menyimpan...' : form.id ? 'Update Post' : 'Create Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}

export default PostsPage
