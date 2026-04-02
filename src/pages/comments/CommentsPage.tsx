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
  Check: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  Close: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
}

const formatDisplayName = (fullname?: string, username?: string, email?: string) => {
  if (fullname?.trim()) return fullname
  if (username?.trim()) return username
  if (email?.trim()) return email.split('@')[0]
  return 'Pengguna'
}

type ApiComment = {
  id?: string | number
  content?: string
  message?: string
  body?: string
  status?: string
  user?: {
    name?: string
    username?: string
  }
  author?: {
    name?: string
    username?: string
  }
  post?: {
    title?: string
  }
  post_title?: string
}

type CommentItem = {
  id: string
  author: string
  post: string
  message: string
  status: string
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const extractCommentArray = (payload: unknown): ApiComment[] => {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord) as ApiComment[]
  }

  if (!isRecord(payload)) {
    return []
  }

  const directData = payload.data

  if (Array.isArray(directData)) {
    return directData.filter(isRecord) as ApiComment[]
  }

  if (isRecord(directData) && Array.isArray(directData.data)) {
    return directData.data.filter(isRecord) as ApiComment[]
  }

  return []
}

const normalizeStatus = (status?: string) => {
  if (!status) return 'Pending'

  const normalized = status.trim().toLowerCase()

  if (['approved', 'approve'].includes(normalized)) return 'Approved'
  if (['pending', 'review'].includes(normalized)) return 'Pending'
  if (['spam', 'blocked', 'rejected', 'reject'].includes(normalized)) return 'Spam'

  return status
}

const mapApiComment = (comment: ApiComment): CommentItem => {
  const author =
    comment.user?.name ??
    comment.user?.username ??
    comment.author?.name ??
    comment.author?.username ??
    'Anon'

  const post = comment.post?.title ?? comment.post_title ?? 'Tanpa Judul Post'
  const message = (comment.content ?? comment.message ?? comment.body ?? '-').trim() || '-'

  return {
    id: String(comment.id ?? '-'),
    author,
    post,
    message,
    status: normalizeStatus(comment.status),
  }
}

const CommentsPage = () => {
  const user = useAuthStore((state) => state.user)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const displayName = useMemo(() => {
    return formatDisplayName(user?.fullname ?? user?.name, user?.username, user?.email)
  }, [user])

  useEffect(() => {
    const loadComments = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { data } = await api.get('/v1/comments')
        setComments(extractCommentArray(data).map(mapApiComment))
      } catch {
        setError('Gagal memuat data komentar dari server.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadComments()
  }, [])

  const pendingCount = useMemo(() => comments.filter((item) => item.status === 'Pending').length, [comments])
  const approvedCount = useMemo(() => comments.filter((item) => item.status === 'Approved').length, [comments])
  const blockedCount = useMemo(() => comments.filter((item) => item.status === 'Spam').length, [comments])

  const getStatusClasses = (status: string) => {
    if (status === 'Approved') return 'bg-emerald-100 text-emerald-700'
    if (status === 'Pending') return 'bg-amber-100 text-amber-700'
    return 'bg-rose-100 text-rose-700'
  }

  return (
    <AppShell>
        <div className="rounded-[40px] border-[5px] border-white bg-gradient-to-b from-white to-slate-50 p-8 shadow-[0px_30px_30px_-20px_rgba(15,23,42,0.16)] sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Community Desk</p>
              <h1 className="mt-2 text-3xl font-black text-slate-800">Moderasi Komentar</h1>
              <p className="mt-1 text-sm text-slate-500">Pantau diskusi, filter spam, dan jaga kualitas interaksi pembaca.</p>
            </div>
            <div className="rounded-[24px] border-2 border-white bg-white px-5 py-3 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.15)]">
              <p className="text-sm font-bold text-slate-800">{displayName}</p>
              <p className="text-xs text-slate-500">Moderator Session</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <article className="rounded-[24px] border-2 border-white bg-white p-5 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending</p>
              <p className="mt-2 text-4xl font-black text-amber-600">{pendingCount}</p>
            </article>
            <article className="rounded-[24px] border-2 border-white bg-white p-5 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Approved</p>
              <p className="mt-2 text-4xl font-black text-emerald-600">{approvedCount}</p>
            </article>
            <article className="rounded-[24px] border-2 border-white bg-white p-5 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Blocked</p>
              <p className="mt-2 text-4xl font-black text-rose-600">{blockedCount}</p>
            </article>
          </div>

          <div className="mt-8 space-y-3">
            {isLoading ? <p className="text-sm text-slate-500">Memuat komentar...</p> : null}
            {!isLoading && error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
            {!isLoading && !error && comments.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada komentar.</p>
            ) : null}

            {!isLoading && !error
              ? comments.map((item) => (
              <article key={item.id} className="rounded-[20px] border-2 border-white bg-white p-5 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700">{item.id}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusClasses(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{item.author} pada post:</p>
                    <p className="font-bold text-slate-800">{item.post}</p>
                    <p className="text-sm text-slate-700">"{item.message}"</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-[14px] bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-700 transition-all hover:bg-emerald-200"
                    >
                      <Icons.Check />
                      Approve
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-[14px] bg-rose-100 px-3 py-2 text-xs font-bold text-rose-700 transition-all hover:bg-rose-200"
                    >
                      <Icons.Close />
                      Reject
                    </button>
                  </div>
                </div>
              </article>
                ))
              : null}
          </div>

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
    </AppShell>
  )
}

export default CommentsPage
