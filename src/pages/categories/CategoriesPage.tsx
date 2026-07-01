import { useEffect, useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { AppShell } from '../../layouts/AppShell'
import { ConfirmModal } from '../../components/ConfirmModal'
import { toast } from '../../lib/toast'
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-1.125V11.25a9 9 0 00-9-9z" />
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

type ApiArticle = {
  id?: number | string
}

type ApiCategory = {
  id: number
  name: string
  slug: string
  description?: string | null
  articles?: ApiArticle[]
}

type CategoriesResponse = {
  message: string
  categories: ApiCategory[]
}

type CategoryResponse = {
  message: string
  category: ApiCategory
}

type ApiErrorPayload = {
  message?: string
  errors?: Record<string, string[]>
}

type CategoryFormState = {
  id?: number
  originalSlug?: string
  name: string
  slug: string
  description: string
}

const emptyForm: CategoryFormState = {
  name: '',
  slug: '',
  description: '',
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

const buildPayload = (form: CategoryFormState) => ({
  name: form.name.trim(),
  slug: form.slug.trim(),
  description: form.description.trim(),
})

const mapCategoryToForm = (category: ApiCategory): CategoryFormState => ({
  id: category.id,
  originalSlug: category.slug,
  name: category.name,
  slug: category.slug,
  description: category.description ?? '',
})

const CategoriesPage = () => {
  const user = useAuthStore((state) => state.user)
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<ApiCategory | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingSlug, setIsDeletingSlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<CategoryFormState>(emptyForm)
  const [reloadKey, setReloadKey] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<ApiCategory | null>(null)

  const displayName = useMemo(() => {
    return formatDisplayName(user?.fullname ?? user?.name, user?.username, user?.email)
  }, [user])

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { data } = await api.get<CategoriesResponse>('/v1/categories')
        const nextCategories = extractCategories(data)
        setCategories(nextCategories)
        setSelectedCategory((current) => {
          if (!current) return nextCategories[0] ?? null
          return nextCategories.find((category) => category.slug === current.slug) ?? nextCategories[0] ?? null
        })
      } catch {
        setCategories([])
        setSelectedCategory(null)
        setError('Gagal memuat data kategori dari server.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadCategories()
  }, [reloadKey])

  const largestGroup = useMemo(() => {
    if (!categories.length) return '-'
    const sorted = [...categories].sort((a, b) => (b.articles?.length ?? 0) - (a.articles?.length ?? 0))
    return sorted[0].name
  }, [categories])

  const totalPostsInCategories = useMemo(() => {
    return categories.reduce((sum, item) => sum + (item.articles?.length ?? 0), 0)
  }, [categories])

  const openCreateModal = () => {
    setForm(emptyForm)
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (category: ApiCategory) => {
    setForm(mapCategoryToForm(category))
    setFormError(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (isSaving) return
    setIsModalOpen(false)
    setForm(emptyForm)
    setFormError(null)
  }

  const handleNameChange = (value: string) => {
    setForm((current) => ({
      ...current,
      name: value,
      slug: current.id ? current.slug : slugify(value),
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setFormError(null)

    try {
      if (form.id && form.originalSlug) {
        await api.put<CategoryResponse>(`/v1/categories/${form.originalSlug}`, buildPayload(form))
        toast.success('Kategori berhasil diperbarui.')
      } else {
        await api.post<CategoryResponse>('/v1/categories', buildPayload(form))
        toast.success('Kategori berhasil dibuat.')
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

  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsDeletingSlug(deleteTarget.slug)
    setError(null)

    try {
      await api.delete(`/v1/categories/${deleteTarget.slug}`)
      toast.success('Kategori berhasil dihapus.')
      setReloadKey((current) => current + 1)
    } catch (requestError) {
      toast.error(resolveErrorMessage(requestError))
    } finally {
      setIsDeletingSlug(null)
      setDeleteTarget(null)
    }
  }

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
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Linked Post</p>
            <p className="mt-2 text-2xl font-black text-emerald-600">{totalPostsInCategories} post</p>
          </article>
        </div>

        {error ? (
          <div className="mt-6 rounded-[20px] bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="rounded-[24px] border-2 border-white bg-white p-6 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-800">Category List</h2>
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-[16px] bg-slate-800 px-4 py-2.5 text-sm font-bold text-white shadow-[0px_10px_15px_-10px_rgba(15,23,42,0.4)] transition-all hover:scale-[1.02]"
              >
                <Icons.Plus />
                New Category
              </button>
            </div>

            <div className="grid gap-3">
              {isLoading ? <p className="text-sm text-slate-500">Memuat kategori...</p> : null}

              {!isLoading && !error && categories.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada kategori.</p>
              ) : null}

              {!isLoading
                ? categories.map((item) => {
                    const isSelected = selectedCategory?.slug === item.slug

                    return (
                      <article
                        key={item.id}
                        className={`rounded-[20px] border-2 p-4 transition-all duration-200 ${
                          isSelected
                            ? 'border-slate-200 bg-white shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.12)]'
                            : 'border-white bg-slate-50 hover:bg-white hover:shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.12)]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedCategory(item)}
                          className="w-full text-left"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="rounded-[12px] bg-white p-2 text-slate-700 shadow-sm">
                                <Icons.Category />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-800">{item.name}</p>
                                <p className="truncate text-xs text-slate-500">/{item.slug}</p>
                              </div>
                            </div>
                            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700">
                              {item.articles?.length ?? 0} post
                            </span>
                          </div>
                        </button>

                        <div className="mt-4 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="rounded-[14px] bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            disabled={isDeletingSlug === item.slug}
                            className="rounded-[14px] bg-rose-100 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {isDeletingSlug === item.slug ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </article>
                    )
                  })
                : null}
            </div>
          </div>

          <aside className="rounded-[24px] border-2 border-white bg-white p-6 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Detail</p>
            {selectedCategory ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-[16px] bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Name</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{selectedCategory.name}</p>
                </div>
                <div className="rounded-[16px] bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Slug</p>
                  <p className="mt-1 break-all text-sm font-semibold text-slate-800">/{selectedCategory.slug}</p>
                </div>
                <div className="rounded-[16px] bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    {selectedCategory.description || 'Tidak ada deskripsi.'}
                  </p>
                </div>
                <div className="rounded-[16px] bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Linked Posts</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{selectedCategory.articles?.length ?? 0} post</p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm font-semibold text-slate-500">Pilih kategori untuk melihat detail.</p>
            )}
          </aside>
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

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Hapus Kategori"
        message={`Apakah Anda yakin ingin menghapus kategori "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        isLoading={isDeletingSlug === deleteTarget?.slug}
        variant="danger"
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />

      {isModalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/40 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[32px] border-[5px] border-white bg-gradient-to-b from-white to-slate-50 p-6 shadow-[0px_30px_30px_-20px_rgba(15,23,42,0.32)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  {form.id ? 'Edit Category' : 'Create Category'}
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-800">
                  {form.id ? 'Update kategori' : 'Kategori baru'}
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
              <label className="block space-y-2 text-sm font-semibold text-slate-700">
                <span>Name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                  required
                  disabled={isSaving}
                />
              </label>

              <label className="block space-y-2 text-sm font-semibold text-slate-700">
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

              <label className="block space-y-2 text-sm font-semibold text-slate-700">
                <span>Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  className="min-h-28 w-full resize-y rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-slate-400"
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
                  {isSaving ? 'Menyimpan...' : form.id ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}

export default CategoriesPage
