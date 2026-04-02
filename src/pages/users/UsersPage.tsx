import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { AppShell } from '../../layouts/AppShell'
import api from '../../lib/axios'

const Icons = {
  User: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
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
  Search: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m0 0A7.5 7.5 0 105.65 5.65a7.5 7.5 0 0010.6 10.6z" />
    </svg>
  ),
}

type ApiUser = {
  id?: string | number
  name?: string
  fullname?: string
  username?: string
  email?: string
  role?: string
}

type UserItem = {
  id: string
  name: string
  username: string
  email: string
  role: string
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

const extractUsersArray = (payload: unknown): ApiUser[] => {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord) as ApiUser[]
  }

  if (!isRecord(payload)) {
    return []
  }

  const directData = payload.data

  if (Array.isArray(directData)) {
    return directData.filter(isRecord) as ApiUser[]
  }

  if (isRecord(directData) && Array.isArray(directData.data)) {
    return directData.data.filter(isRecord) as ApiUser[]
  }

  return []
}

const mapApiUser = (user: ApiUser): UserItem => {
  const name = (user.fullname ?? user.name ?? user.username ?? 'Tanpa Nama').trim() || 'Tanpa Nama'

  return {
    id: String(user.id ?? '-'),
    name,
    username: (user.username ?? '-').trim() || '-',
    email: (user.email ?? '-').trim() || '-',
    role: (user.role ?? 'user').trim() || 'user',
  }
}

const UsersPage = () => {
  const authUser = useAuthStore((state) => state.user)
  const [users, setUsers] = useState<UserItem[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const displayName = useMemo(() => {
    return formatDisplayName(authUser?.fullname ?? authUser?.name, authUser?.username, authUser?.email)
  }, [authUser])

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { data } = await api.get('/v1/users')
        setUsers(extractUsersArray(data).map(mapApiUser))
      } catch {
        setError('Gagal memuat data user dari server.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadUsers()
  }, [])

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) {
      return users
    }

    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(keyword) ||
        user.username.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword)
      )
    })
  }, [search, users])

  const adminCount = useMemo(() => {
    return users.filter((user) => user.role.toLowerCase() === 'admin').length
  }, [users])

  return (
    <AppShell>
      <div className="rounded-[40px] border-[5px] border-white bg-gradient-to-b from-white to-slate-50 p-8 shadow-[0px_30px_30px_-20px_rgba(15,23,42,0.16)] sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">User Management</p>
            <h1 className="mt-2 text-3xl font-black text-slate-800">Daftar Pengguna</h1>
            <p className="mt-1 text-sm text-slate-500">Kelola pengguna yang memiliki akses ke sistem konten.</p>
          </div>

          <div className="flex items-center gap-4 rounded-[24px] border-2 border-white bg-white px-5 py-3 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.15)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-slate-800 text-sm font-bold text-white">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{displayName}</p>
              <p className="text-xs text-slate-500">Access Manager</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <article className="rounded-[24px] border-2 border-white bg-white p-5 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Users</p>
            <p className="mt-2 text-4xl font-black text-slate-800">{users.length}</p>
          </article>
          <article className="rounded-[24px] border-2 border-white bg-white p-5 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Admin</p>
            <p className="mt-2 text-4xl font-black text-slate-800">{adminCount}</p>
          </article>
          <article className="rounded-[24px] border-2 border-white bg-white p-5 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Regular Users</p>
            <p className="mt-2 text-4xl font-black text-slate-800">{Math.max(users.length - adminCount, 0)}</p>
          </article>
        </div>

        <div className="mt-8 rounded-[24px] border-2 border-white bg-white p-5 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)] sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex w-full items-center gap-2 rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 sm:max-w-sm">
              <Icons.Search />
              <input
                type="text"
                placeholder="Cari user..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full border-none bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>
          </div>

          <div className="overflow-x-auto rounded-[18px] border border-slate-100">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                      Memuat data user...
                    </td>
                  </tr>
                ) : null}

                {!isLoading && error ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm font-semibold text-rose-600">
                      {error}
                    </td>
                  </tr>
                ) : null}

                {!isLoading && !error && filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                      Data user tidak ditemukan.
                    </td>
                  </tr>
                ) : null}

                {!isLoading && !error
                  ? filteredUsers.map((user) => (
                      <tr key={user.id} className="border-t border-slate-100 bg-white transition-colors hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-semibold text-slate-500">{user.id}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{user.name}</td>
                        <td className="px-4 py-3 text-slate-600">{user.username}</td>
                        <td className="px-4 py-3 text-slate-600">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold uppercase text-slate-700">
                            {user.role}
                          </span>
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link
            to="/posts"
            className="flex items-center gap-3 rounded-[20px] border-2 border-white bg-slate-50 px-4 py-3 font-semibold text-slate-700 transition-all hover:bg-white hover:shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.12)]"
          >
            <Icons.Post />
            Lihat Posts
          </Link>
          <Link
            to="/comments"
            className="flex items-center gap-3 rounded-[20px] border-2 border-white bg-slate-50 px-4 py-3 font-semibold text-slate-700 transition-all hover:bg-white hover:shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.12)]"
          >
            <Icons.Comment />
            Moderasi Komentar
          </Link>
        </div>
      </div>
    </AppShell>
  )
}

export default UsersPage
