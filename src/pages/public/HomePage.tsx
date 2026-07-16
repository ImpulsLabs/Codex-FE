import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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

type ApiArticle = {
  id: number
  title: string
  slug: string
  thumbnail?: string | null
  description?: string | null
  content?: string
  created_at?: string
  user?: ApiUser | null
  category?: ApiCategory | null
}

type ArticlePaginator = {
  data: ApiArticle[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

type ArticlesResponse = {
  message: string
  articles: ArticlePaginator
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

const stripHtml = (value?: string | null) => {
  if (!value) return ''
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

const getArticleExcerpt = (article: ApiArticle) => {
  return article.description?.trim() || stripHtml(article.content) || 'Tidak ada ringkasan untuk artikel ini.'
}

const getThumbnailUrl = (thumbnail?: string | null) => {
  if (!thumbnail) return null
  if (/^https?:\/\//i.test(thumbnail)) return thumbnail
  return `${API_ORIGIN}/storage/${thumbnail.replace(/^\/+/, '')}`
}

const buildPageNumbers = (currentPage: number, lastPage: number) => {
  const start = Math.max(1, currentPage - 2)
  const end = Math.min(lastPage, currentPage + 2)

  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

const HomePage = () => {
  const [articles, setArticles] = useState<ApiArticle[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(6)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [rangeText, setRangeText] = useState('0 artikel')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const hasActiveSearch = search.trim().length > 0

  useEffect(() => {
    const loadArticles = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { data } = await api.get<ArticlesResponse>('/v1/articles', {
          params: {
            search,
            limit,
            page,
          },
        })

        const paginator = data.articles
        setArticles(paginator.data)
        setLastPage(paginator.last_page || 1)
        setTotal(paginator.total || 0)
        setRangeText(
          paginator.from && paginator.to
            ? `${paginator.from}-${paginator.to} dari ${paginator.total} artikel`
            : `${paginator.total} artikel`,
        )
      } catch {
        setArticles([])
        setError('Gagal memuat artikel dari server.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadArticles()
  }, [limit, page, reloadKey, search])

  const pageNumbers = useMemo(() => buildPageNumbers(page, lastPage), [lastPage, page])

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

  const handleLimitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setPage(1)
    setLimit(Number(event.target.value))
  }

  return (
    <AppShell>
      <div className="rounded-[28px] border-[5px] border-white bg-gradient-to-b from-white to-slate-50 p-4 shadow-[0px_30px_30px_-20px_rgba(15,23,42,0.16)] sm:rounded-[40px] sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Published Articles</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-black text-slate-800 sm:text-4xl">
              Baca artikel terbaru dari ImpulsLabs
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Temukan artikel yang sudah dipublikasikan, cari berdasarkan judul atau isi, lalu lanjutkan membaca dari daftar terbaru.
            </p>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="rounded-[24px] border-2 border-white bg-white p-3 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]"
          >
            <label htmlFor="article-search" className="sr-only">
              Cari artikel
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="article-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Cari artikel..."
                className="min-w-0 flex-1 rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400"
              />
              {searchInput || hasActiveSearch ? (
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
                disabled={isLoading}
                className="rounded-[16px] bg-slate-800 px-4 py-2.5 text-sm font-bold text-white shadow-[0px_10px_15px_-10px_rgba(15,23,42,0.4)] transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
              >
                Cari
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 flex flex-col gap-3 rounded-[24px] border-2 border-white bg-white p-5 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">{isLoading ? 'Memuat artikel...' : rangeText}</p>
            {hasActiveSearch ? (
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Hasil pencarian untuk "{search}"
              </p>
            ) : (
              <p className="mt-1 text-xs font-semibold text-slate-500">Menampilkan artikel published terbaru</p>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            Tampilkan
            <select
              value={limit}
              onChange={handleLimitChange}
              disabled={isLoading}
              className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400"
            >
              <option value={6}>6</option>
              <option value={9}>9</option>
              <option value={12}>12</option>
            </select>
          </label>
        </div>

        {error ? (
          <div className="mt-8 flex flex-col gap-3 rounded-[24px] border-2 border-white bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)] sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setReloadKey((current) => current + 1)}
              className="rounded-[16px] bg-white px-3 py-2 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100"
            >
              Coba lagi
            </button>
          </div>
        ) : null}

        {!isLoading && !error && articles.length === 0 ? (
          <div className="mt-8 rounded-[24px] border-2 border-white bg-white px-4 py-10 text-center shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
            <p className="text-sm font-semibold text-slate-600">Artikel tidak ditemukan.</p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {isLoading
            ? Array.from({ length: limit }, (_, index) => (
                <article
                  key={index}
                  className="h-[420px] animate-pulse rounded-[24px] border-2 border-white bg-white shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]"
                />
              ))
            : articles.map((article) => {
                const thumbnailUrl = getThumbnailUrl(article.thumbnail)
                const author = article.user?.fullname || article.user?.username || 'ImpulsLabs'
                const excerpt = getArticleExcerpt(article)

                return (
                  <article
                    key={article.id}
                    className="overflow-hidden rounded-[24px] border-2 border-white bg-white shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)] transition-all hover:-translate-y-0.5 hover:shadow-[0px_18px_28px_-16px_rgba(15,23,42,0.22)]"
                  >
                    <div className="aspect-[16/10] bg-slate-200">
                      {thumbnailUrl ? (
                        <img src={thumbnailUrl} alt={article.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-800 px-6 text-center text-lg font-black text-white">
                          {article.title}
                        </div>
                      )}
                    </div>

                    <div className="flex min-h-[230px] flex-col p-5">
                      <div className="flex flex-wrap gap-2 text-xs font-bold uppercase text-slate-500">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                          {article.category?.name || 'Uncategorized'}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                          {formatDate(article.created_at)}
                        </span>
                      </div>

                      <h2 className="mt-3 text-xl font-black leading-7 text-slate-900">{article.title}</h2>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{excerpt}</p>

                      <div className="mt-auto flex items-center justify-between pt-5">
                        <p className="min-w-0 truncate text-sm font-semibold text-slate-500">{author}</p>
                        <Link
                          to={`/articles/${article.slug}`}
                          className="rounded-[16px] bg-slate-800 px-3 py-2 text-sm font-bold text-white shadow-[0px_10px_15px_-10px_rgba(15,23,42,0.4)] transition-all hover:scale-[1.02]"
                        >
                          Baca
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
        </div>

        {!isLoading && !error && total > 0 ? (
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="rounded-[16px] border-2 border-white bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sebelumnya
            </button>

            <div className="flex justify-center gap-2">
              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`h-10 w-10 rounded-[16px] text-sm font-bold transition-colors ${
                    pageNumber === page
                      ? 'bg-slate-900 text-white'
                      : 'border-2 border-white bg-white text-slate-700 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)] hover:bg-slate-50'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setPage((current) => Math.min(lastPage, current + 1))}
              disabled={page >= lastPage}
              className="rounded-[16px] border-2 border-white bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Berikutnya
            </button>

            <p className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 sm:hidden">
              Halaman {page} dari {lastPage}
            </p>
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}

export default HomePage
