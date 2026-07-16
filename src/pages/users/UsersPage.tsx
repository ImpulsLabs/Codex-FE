import { useEffect, useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { AppShell } from '../../layouts/AppShell'
import { ConfirmModal } from '../../components/ConfirmModal'
import { toast } from '../../lib/toast'
import api from '../../lib/axios'

const Icons = {
  User: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
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
  Search: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m0 0A7.5 7.5 0 105.65 5.65a7.5 7.5 0 0010.6 10.6z" />
    </svg>
  ),
}

type ApiArticle = {
  id?: string | number
}

type ApiUser = {
  id: string | number
  name?: string
  fullname?: string
  username: string
  email: string
  role: 'admin' | 'author' | string
  articles?: ApiArticle[]
}

type UserFormState = {
  username: string
  fullname: string
  email: string
  role: 'admin' | 'author'
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

const extractUsers = (payload: unknown): ApiUser[] => {
  if (Array.isArray(payload)) return payload.filter(isRecord) as ApiUser[]
  if (!isRecord(payload)) return []

  if (Array.isArray(payload.users)) return payload.users.filter(isRecord) as ApiUser[]
  if (Array.isArray(payload.categories)) return payload.categories.filter(isRecord) as ApiUser[]
  if (Array.isArray(payload.data)) return payload.data.filter(isRecord) as ApiUser[]

  return []
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

const mapUserToForm = (user: ApiUser): UserFormState => ({
  username: user.username,
  fullname: user.fullname ?? user.name ?? '',
  email: user.email,
  role: user.role === 'admin' ? 'admin' : 'author',
})

const UsersPage = () => {
  const authUser = useAuthStore((state) => state.user)
  const [users, setUsers] = useState<ApiUser[]>([])
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingUsername, setIsDeletingUsername] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ApiUser | null>(null)
  const [form, setForm] = useState<UserFormState>({
    username: '',
    fullname: '',
    email: '',
    role: 'author',
  })
  const [reloadKey, setReloadKey] = useState(0)

  const isAdmin = authUser?.role === 'admin'

  const displayName = useMemo(() => {
    return formatDisplayName(authUser?.fullname ?? authUser?.name, authUser?.username, authUser?.email)
  }, [authUser])

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { data } = await api.get('/v1/users')
        const nextUsers = extractUsers(data)
        setUsers(nextUsers)
        setSelectedUser((current) => {
          if (!current) return nextUsers[0] ?? null
          return nextUsers.find((user) => user.username === current.username) ?? nextUsers[0] ?? null
        })
      } catch (requestError) {
        setUsers([])
        setSelectedUser(null)

        if (isAxiosError<ApiErrorPayload>(requestError) && requestError.response?.status === 403) {
          setError('Akun Anda tidak memiliki akses ke data users (403 Forbidden).')
        } else {
          setError(resolveErrorMessage(requestError))
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (isAdmin) {
      void loadUsers()
    } else {
      setUsers([])
      setSelectedUser(null)
      setIsLoading(false)
      setError('Halaman ini khusus admin.')
    }
  }, [isAdmin, reloadKey])

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return users

    return users.filter((user) => {
      const name = user.fullname ?? user.name ?? ''
      return (
        name.toLowerCase().includes(keyword) ||
        user.username.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        user.role.toLowerCase().includes(keyword)
      )
    })
  }, [search, users])

  const adminCount = useMemo(() => users.filter((user) => user.role === 'admin').length, [users])
  const authorCount = useMemo(() => users.filter((user) => user.role === 'author').length, [users])

  const openEditModal = (user: ApiUser) => {
    setForm(mapUserToForm(user))
    setFormError(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (isSaving) return
    setIsModalOpen(false)
    setFormError(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setFormError(null)

    try {
      await api.put(`/v1/users/${form.username}`, {
        fullname: form.fullname.trim(),
        email: form.email.trim(),
        role: form.role,
      })

      toast.success('User berhasil diperbarui.')
      setIsModalOpen(false)
      setReloadKey((current) => current + 1)
    } catch (requestError) {
      setFormError(resolveErrorMessage(requestError))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsDeletingUsername(deleteTarget.username)
    setError(null)

    try {
      await api.delete(`/v1/users/${deleteTarget.username}`)
      toast.success('User berhasil dihapus.')
      setReloadKey((current) => current + 1)
    } catch (requestError) {
      toast.error(resolveErrorMessage(requestError))
    } finally {
      setIsDeletingUsername(null)
      setDeleteTarget(null)
    }
  }

  return (
    <AppShell>
      <div className="rounded-[28px] border-[5px] border-white bg-gradient-to-b from-white to-slate-50 p-4 shadow-[0px_30px_30px_-20px_rgba(15,23,42,0.16)] sm:rounded-[40px] sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">User Management</p>
            <h1 className="mt-2 text-3xl font-black text-slate-800">Daftar Pengguna</h1>
            <p className="mt-1 text-sm text-slate-500">Kelola admin dan author yang memiliki akses ke sistem konten.</p>
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
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Author</p>
            <p className="mt-2 text-4xl font-black text-slate-800">{authorCount}</p>
          </article>
        </div>

        {error ? (
          <div className="mt-6 rounded-[20px] bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
          <section className="rounded-[24px] border-2 border-white bg-white p-5 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)] sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-slate-800">User List</h2>
              <label className="flex w-full items-center gap-2 rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 sm:max-w-sm">
                <Icons.Search />
                <input
                  type="search"
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
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3 text-right">Action</th>
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

                  {!isLoading && !error && filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                        Data user tidak ditemukan.
                      </td>
                    </tr>
                  ) : null}

                  {!isLoading && !error
                    ? filteredUsers.map((user) => {
                        const name = user.fullname ?? user.name ?? user.username

                        return (
                          <tr key={user.id} className="border-t border-slate-100 bg-white transition-colors hover:bg-slate-50/80">
                            <td className="px-4 py-3 font-semibold text-slate-500">{user.id}</td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-800">{name}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{user.username}</td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold uppercase text-slate-700">
                                {user.role}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedUser(user)}
                                  className="rounded-[14px] bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
                                >
                                  Detail
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(user)}
                                  className="rounded-[14px] bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(user)}
                                  disabled={isDeletingUsername === user.username}
                                  className="rounded-[14px] bg-rose-100 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                  {isDeletingUsername === user.username ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    : null}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="rounded-[24px] border-2 border-white bg-white p-6 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Detail</p>
            {selectedUser ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-[16px] bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Name</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {selectedUser.fullname ?? selectedUser.name ?? selectedUser.username}
                  </p>
                </div>
                <div className="rounded-[16px] bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Username</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{selectedUser.username}</p>
                </div>
                <div className="rounded-[16px] bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Email</p>
                  <p className="mt-1 break-all text-sm font-semibold text-slate-800">{selectedUser.email}</p>
                </div>
                <div className="rounded-[16px] bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Articles</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{selectedUser.articles?.length ?? 0} post</p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm font-semibold text-slate-500">Pilih user untuk melihat detail.</p>
            )}
          </aside>
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

      {isModalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/40 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[32px] border-[5px] border-white bg-gradient-to-b from-white to-slate-50 p-6 shadow-[0px_30px_30px_-20px_rgba(15,23,42,0.32)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Edit User</p>
                <h2 className="mt-2 text-2xl font-black text-slate-800">{form.username}</h2>
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
                <span>Full Name</span>
                <input
                  type="text"
                  value={form.fullname}
                  onChange={(event) => setForm((current) => ({ ...current, fullname: event.target.value }))}
                  className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                  required
                  disabled={isSaving}
                />
              </label>

              <label className="block space-y-2 text-sm font-semibold text-slate-700">
                <span>Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                  required
                  disabled={isSaving}
                />
              </label>

              <label className="block space-y-2 text-sm font-semibold text-slate-700">
                <span>Role</span>
                <select
                  value={form.role}
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as UserFormState['role'] }))}
                  className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                  disabled={isSaving}
                >
                  <option value="admin">Admin</option>
                  <option value="author">Author</option>
                </select>
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
                  {isSaving ? 'Menyimpan...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Hapus User"
        message={`Apakah Anda yakin ingin menghapus user "${deleteTarget?.username}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        isLoading={isDeletingUsername === deleteTarget?.username}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppShell>
  )
}

export default UsersPage
