import { useEffect, useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { AppShell } from '../../layouts/AppShell'
import { ConfirmModal } from '../../components/ConfirmModal'
import { toast } from '../../lib/toast'
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
  Comment: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
    </svg>
  ),
  Search: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m0 0A7.5 7.5 0 105.65 5.65a7.5 7.5 0 0010.6 10.6z" />
    </svg>
  ),
}

type ApiArticle = {
  id?: string | number
  title?: string
  slug?: string
}

type ApiComment = {
  id: string | number
  name: string
  email: string
  message: string
  created_at?: string
  article?: ApiArticle | null
}

type ApiErrorPayload = {
  message?: string
  errors?: Record<string, string[]>
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

const extractComments = (payload: unknown): ApiComment[] => {
  if (Array.isArray(payload)) return payload.filter(isRecord) as ApiComment[]
  if (!isRecord(payload)) return []

  if (Array.isArray(payload.comments)) return payload.comments.filter(isRecord) as ApiComment[]
  if (Array.isArray(payload.categories)) return payload.categories.filter(isRecord) as ApiComment[]
  if (Array.isArray(payload.data)) return payload.data.filter(isRecord) as ApiComment[]

  return []
}

const formatDate = (value?: string) => {
  if (!value) return '-'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return parsed.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
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

const CommentsPage = () => {
  const user = useAuthStore((state) => state.user)
  const [comments, setComments] = useState<ApiComment[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDeletingId, setIsDeletingId] = useState<string | number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<ApiComment | null>(null)

  const displayName = useMemo(() => {
    return formatDisplayName(user?.fullname ?? user?.name, user?.username, user?.email)
  }, [user])

  useEffect(() => {
    const loadComments = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { data } = await api.get('/v1/comments')
        setComments(extractComments(data))
      } catch {
        setComments([])
        setError('Gagal memuat data komentar dari server.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadComments()
  }, [reloadKey])

  const filteredComments = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return comments

    return comments.filter((comment) => {
      return (
        comment.name.toLowerCase().includes(keyword) ||
        comment.email.toLowerCase().includes(keyword) ||
        comment.message.toLowerCase().includes(keyword) ||
        (comment.article?.title ?? '').toLowerCase().includes(keyword)
      )
    })
  }, [comments, search])

  const linkedArticleCount = useMemo(() => {
    return new Set(comments.map((comment) => comment.article?.id).filter(Boolean)).size
  }, [comments])

  const latestCommentDate = useMemo(() => {
    const sorted = [...comments].sort((a, b) => new Date(b.created_at ?? '').getTime() - new Date(a.created_at ?? '').getTime())
    return formatDate(sorted[0]?.created_at)
  }, [comments])

  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsDeletingId(deleteTarget.id)
    setError(null)

    try {
      await api.delete(`/v1/comments/${deleteTarget.id}`)
      toast.success('Komentar berhasil dihapus.')
      setReloadKey((current) => current + 1)
    } catch (requestError) {
      toast.error(resolveErrorMessage(requestError))
    } finally {
      setIsDeletingId(null)
      setDeleteTarget(null)
    }
  }

  return (
    <AppShell>
      <div className="rounded-[40px] border-[5px] border-white bg-gradient-to-b from-white to-slate-50 p-8 shadow-[0px_30px_30px_-20px_rgba(15,23,42,0.16)] sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Community Desk</p>
            <h1 className="mt-2 text-3xl font-black text-slate-800">Moderasi Komentar</h1>
            <p className="mt-1 text-sm text-slate-500">Pantau komentar pembaca dan hapus komentar yang tidak sesuai.</p>
          </div>
          <div className="rounded-[24px] border-2 border-white bg-white px-5 py-3 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.15)]">
            <p className="text-sm font-bold text-slate-800">{displayName}</p>
            <p className="text-xs text-slate-500">Moderator Session</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <article className="rounded-[24px] border-2 border-white bg-white p-5 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Comments</p>
            <p className="mt-2 text-4xl font-black text-slate-800">{comments.length}</p>
          </article>
          <article className="rounded-[24px] border-2 border-white bg-white p-5 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Linked Articles</p>
            <p className="mt-2 text-4xl font-black text-slate-800">{linkedArticleCount}</p>
          </article>
          <article className="rounded-[24px] border-2 border-white bg-white p-5 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Latest</p>
            <p className="mt-2 text-2xl font-black text-slate-800">{latestCommentDate}</p>
          </article>
        </div>

        {error ? (
          <div className="mt-6 rounded-[20px] bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="mt-8 rounded-[24px] border-2 border-white bg-white p-5 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)] sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-slate-800">Comment List</h2>
            <label className="flex w-full items-center gap-2 rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 sm:max-w-sm">
              <Icons.Search />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari komentar..."
                className="w-full border-none bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>
          </div>

          <div className="space-y-3">
            {isLoading ? <p className="text-sm text-slate-500">Memuat komentar...</p> : null}

            {!isLoading && !error && filteredComments.length === 0 ? (
              <p className="rounded-[20px] bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                Komentar tidak ditemukan.
              </p>
            ) : null}

            {!isLoading
              ? filteredComments.map((comment) => (
                  <article
                    key={comment.id}
                    className="rounded-[20px] border-2 border-white bg-slate-50 p-5 transition-all hover:bg-white hover:shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.12)]"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700">
                            #{comment.id}
                          </span>
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">
                          {comment.name} - {comment.email}
                        </p>
                        <p className="font-bold text-slate-800">{comment.article?.title ?? 'Tanpa Judul Artikel'}</p>
                        <p className="text-sm leading-6 text-slate-700">"{comment.message}"</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(comment)}
                        disabled={isDeletingId === comment.id}
                        className="inline-flex items-center justify-center rounded-[14px] bg-rose-100 px-3 py-2 text-xs font-bold text-rose-700 transition-all hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isDeletingId === comment.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </article>
                ))
              : null}
          </div>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link
            to="/posts"
            className="flex items-center gap-3 rounded-[20px] border-2 border-white bg-slate-50 px-4 py-3 font-semibold text-slate-700 transition-all hover:bg-white hover:shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.12)]"
          >
            <Icons.Post />
            Kembali ke Posts
          </Link>
          <Link
            to="/categories"
            className="flex items-center gap-3 rounded-[20px] border-2 border-white bg-slate-50 px-4 py-3 font-semibold text-slate-700 transition-all hover:bg-white hover:shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.12)]"
          >
            <Icons.Category />
            Lihat Categories
          </Link>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Hapus Komentar"
        message={`Apakah Anda yakin ingin menghapus komentar dari "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        isLoading={isDeletingId === deleteTarget?.id}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppShell>
  )
}

export default CommentsPage
