import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { Link, useParams } from 'react-router-dom'
import api from '../../lib/axios'
import { AppShell } from '../../layouts/AppShell'

type ApiUser = {
  username?: string
  fullname?: string
  role?: string
}

type ApiCategory = {
  name?: string
  slug?: string
}

type ApiComment = {
  id: number
  name: string
  email?: string
  message: string
  created_at?: string
}

type ApiArticle = {
  id: number
  title: string
  slug: string
  thumbnail?: string | null
  description?: string | null
  content: string
  created_at?: string
  updated_at?: string
  user?: ApiUser | null
  category?: ApiCategory | null
  comments?: ApiComment[]
}

type LatestArticle = {
  id: number
  title: string
  slug: string
  created_at?: string
  updated_at?: string
  user?: ApiUser | null
}

type ArticleDetailResponse = {
  message: string
  article: ApiArticle
  latest_articles: LatestArticle[]
}

type CreateCommentResponse = {
  message: string
  category?: ApiComment
  comment?: ApiComment
}

type ApiErrorPayload = {
  message?: string
  errors?: Record<string, string[]>
}

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api').replace(/\/api\/?$/, '')

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

const getThumbnailUrl = (thumbnail?: string | null) => {
  if (!thumbnail) return null
  if (/^https?:\/\//i.test(thumbnail)) return thumbnail
  return `${API_ORIGIN}/storage/${thumbnail.replace(/^\/+/, '')}`
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

  return 'Komentar gagal dikirim.'
}

const ArticleDetailPage = () => {
  const { slug } = useParams()
  const [article, setArticle] = useState<ApiArticle | null>(null)
  const [latestArticles, setLatestArticles] = useState<LatestArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [commentName, setCommentName] = useState('')
  const [commentEmail, setCommentEmail] = useState('')
  const [commentMessage, setCommentMessage] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [commentSuccess, setCommentSuccess] = useState<string | null>(null)

  useEffect(() => {
    const loadArticle = async () => {
      if (!slug) {
        setError('Slug artikel tidak valid.')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const { data } = await api.get<ArticleDetailResponse>(`/v1/articles/${slug}`)
        setArticle(data.article)
        setLatestArticles(data.latest_articles ?? [])
      } catch {
        setArticle(null)
        setLatestArticles([])
        setError('Artikel tidak ditemukan atau gagal dimuat.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadArticle()
  }, [reloadKey, slug])

  if (isLoading) {
    return (
      <AppShell>
        <div className="rounded-[40px] border-[5px] border-white bg-gradient-to-b from-white to-slate-50 p-8 shadow-[0px_30px_30px_-20px_rgba(15,23,42,0.16)] sm:p-10">
          <div className="h-6 w-32 animate-pulse rounded-[16px] bg-slate-200" />
          <div className="mt-6 h-12 max-w-3xl animate-pulse rounded-[20px] bg-slate-200" />
          <div className="mt-5 aspect-[16/9] animate-pulse rounded-[24px] bg-slate-200" />
          <div className="mt-8 grid gap-4">
            <div className="h-5 animate-pulse rounded-[16px] bg-slate-200" />
            <div className="h-5 animate-pulse rounded-[16px] bg-slate-200" />
            <div className="h-5 w-2/3 animate-pulse rounded-[16px] bg-slate-200" />
          </div>
        </div>
      </AppShell>
    )
  }

  if (error || !article) {
    return (
      <AppShell>
        <div className="rounded-[40px] border-[5px] border-white bg-gradient-to-b from-white to-slate-50 p-8 shadow-[0px_30px_30px_-20px_rgba(15,23,42,0.16)] sm:p-10">
          <Link to="/" className="text-sm font-bold text-slate-500 hover:text-slate-800">
            Kembali ke Articles
          </Link>
          <div className="mt-8 rounded-[24px] border-2 border-white bg-rose-50 p-6 text-sm font-semibold text-rose-700 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((current) => current + 1)}
              className="mt-4 rounded-[16px] bg-white px-4 py-2 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100"
            >
              Coba lagi
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  const thumbnailUrl = getThumbnailUrl(article.thumbnail)
  const author = article.user?.fullname || article.user?.username || 'ImpulsLabs'
  const comments = article.comments ?? []

  const handleCommentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmittingComment(true)
    setCommentError(null)
    setCommentSuccess(null)

    const formData = new FormData()
    formData.append('name', commentName.trim())
    formData.append('email', commentEmail.trim())
    formData.append('message', commentMessage.trim())
    formData.append('article_id', String(article.id))

    try {
      const { data } = await api.post<CreateCommentResponse>('/v1/comments', formData, {
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      })

      const createdComment = data.comment ?? data.category

      if (createdComment) {
        setArticle((currentArticle) => {
          if (!currentArticle) return currentArticle

          return {
            ...currentArticle,
            comments: [...(currentArticle.comments ?? []), createdComment],
          }
        })
      } else {
        setReloadKey((current) => current + 1)
      }

      setCommentName('')
      setCommentEmail('')
      setCommentMessage('')
      setCommentSuccess('Komentar berhasil dikirim.')
    } catch (requestError) {
      setCommentError(resolveErrorMessage(requestError))
    } finally {
      setIsSubmittingComment(false)
    }
  }

  return (
    <AppShell>
      <div className="rounded-[40px] border-[5px] border-white bg-gradient-to-b from-white to-slate-50 p-8 shadow-[0px_30px_30px_-20px_rgba(15,23,42,0.16)] sm:p-10">
        <Link to="/" className="text-sm font-bold text-slate-500 hover:text-slate-800">
          Kembali ke Articles
        </Link>

        <div className="mt-6">
          <div className="flex flex-wrap gap-2 text-xs font-bold uppercase text-slate-500">
            <span className="rounded-full bg-white px-3 py-1.5 text-slate-600 shadow-sm">
              {article.category?.name || 'Uncategorized'}
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 text-slate-600 shadow-sm">
              {formatDate(article.created_at)}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-black leading-tight text-slate-800 sm:text-4xl">{article.title}</h1>
          {article.description ? <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{article.description}</p> : null}

          <div className="mt-5 rounded-[24px] border-2 border-white bg-white p-5 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Penulis</p>
            <p className="mt-2 text-sm font-bold text-slate-800">{author}</p>
            <p className="mt-1 text-xs text-slate-500">{article.user?.role || 'Author'}</p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-[24px] border-2 border-white bg-white shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
          <div className="aspect-[16/9] bg-slate-200">
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt={article.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-800 px-6 text-center text-xl font-black text-white">
                {article.title}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
          <article className="rounded-[24px] border-2 border-white bg-white p-6 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)] sm:p-7">
            <div
              className="space-y-4 text-sm leading-7 text-slate-700 [&_a]:font-bold [&_a]:text-slate-900 [&_h2]:pt-3 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-slate-800 [&_h3]:pt-2 [&_h3]:text-xl [&_h3]:font-black [&_h3]:text-slate-800 [&_img]:rounded-[20px] [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:leading-7 [&_strong]:text-slate-900 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </article>

          <aside className="space-y-4">
            <section className="rounded-[24px] border-2 border-white bg-white p-5 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Latest Articles</h2>
              <div className="mt-4 space-y-3">
                {latestArticles.length > 0 ? (
                  latestArticles.map((item) => (
                    <Link
                      key={item.id}
                      to={`/articles/${item.slug}`}
                      className="block rounded-[18px] bg-slate-50 p-4 transition-all hover:bg-white hover:shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.12)]"
                    >
                      <p className="text-sm font-black leading-6 text-slate-800">{item.title}</p>
                      <p className="mt-2 text-xs font-semibold text-slate-500">{formatDate(item.created_at)}</p>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm font-semibold text-slate-500">Belum ada artikel terbaru.</p>
                )}
              </div>
            </section>
          </aside>
        </div>

        <section className="mt-8 rounded-[24px] border-2 border-white bg-white p-6 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)] sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Komentar</p>
              <h2 className="mt-2 text-2xl font-black text-slate-800">{comments.length} komentar</h2>
            </div>
          </div>

          <form onSubmit={handleCommentSubmit} className="mt-6 rounded-[20px] bg-slate-50 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                <span>Nama</span>
                <input
                  type="text"
                  value={commentName}
                  onChange={(event) => setCommentName(event.target.value)}
                  className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400"
                  placeholder="Nama pembaca"
                  required
                  disabled={isSubmittingComment}
                />
              </label>

              <label className="space-y-2 text-sm font-semibold text-slate-700">
                <span>Email</span>
                <input
                  type="email"
                  value={commentEmail}
                  onChange={(event) => setCommentEmail(event.target.value)}
                  className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400"
                  placeholder="email@example.com"
                  required
                  disabled={isSubmittingComment}
                />
              </label>
            </div>

            <label className="mt-3 block space-y-2 text-sm font-semibold text-slate-700">
              <span>Komentar</span>
              <textarea
                value={commentMessage}
                onChange={(event) => setCommentMessage(event.target.value)}
                className="min-h-28 w-full resize-y rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400"
                placeholder="Tulis komentar..."
                required
                disabled={isSubmittingComment}
              />
            </label>

            {commentError ? <p className="mt-3 text-sm font-semibold text-rose-600">{commentError}</p> : null}
            {commentSuccess ? <p className="mt-3 text-sm font-semibold text-emerald-600">{commentSuccess}</p> : null}

            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingComment}
                className="rounded-[16px] bg-slate-800 px-4 py-2.5 text-sm font-bold text-white shadow-[0px_10px_15px_-10px_rgba(15,23,42,0.4)] transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmittingComment ? 'Mengirim...' : 'Kirim Komentar'}
              </button>
            </div>
          </form>

          <div className="mt-5 space-y-3">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <article key={comment.id} className="rounded-[20px] bg-slate-50 p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-bold text-slate-800">{comment.name}</p>
                    <p className="text-xs font-semibold text-slate-500">{formatDate(comment.created_at)}</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{comment.message}</p>
                </article>
              ))
            ) : (
              <p className="rounded-[20px] bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                Belum ada komentar untuk artikel ini.
              </p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  )
}

export default ArticleDetailPage
