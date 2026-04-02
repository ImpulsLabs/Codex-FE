import { useEffect, useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import { Link } from 'react-router-dom'
import { AppShell } from '../../layouts/AppShell'
import api from '../../lib/axios'
import { useAuthStore } from '../../stores/authStore'

type ApiProfile = {
  id?: string | number
  name?: string
  fullname?: string
  username?: string
  email?: string
  role?: string
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

const extractProfile = (payload: unknown): ApiProfile | null => {
  if (!payload) {
    return null
  }

  if (isRecord(payload)) {
    if ('email' in payload || 'username' in payload || 'fullname' in payload || 'name' in payload) {
      return payload as ApiProfile
    }

    if (isRecord(payload.data)) {
      const data = payload.data as Record<string, unknown>

      if ('email' in data || 'username' in data || 'fullname' in data || 'name' in data) {
        return data as ApiProfile
      }

      if (isRecord(data.user)) {
        return data.user as ApiProfile
      }
    }

    if (isRecord(payload.user)) {
      return payload.user as ApiProfile
    }
  }

  return null
}

const ProfilePage = () => {
  const authUser = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)

  const [fullname, setFullname] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('user')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const headerName = useMemo(() => formatDisplayName(fullname, username, email), [fullname, username, email])

  useEffect(() => {
    const hydrateFromStore = () => {
      setFullname(authUser?.fullname ?? authUser?.name ?? '')
      setUsername(authUser?.username ?? '')
      setEmail(authUser?.email ?? '')
      setRole(authUser?.role ?? 'user')
    }

    const loadProfile = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { data } = await api.get('/v1/profiles')
        const profile = extractProfile(data)

        if (!profile) {
          hydrateFromStore()
          setError('Profil dari API tidak ditemukan, menampilkan data sesi lokal.')
          return
        }

        const nextFullname = profile.fullname ?? profile.name ?? ''
        const nextUsername = profile.username ?? ''
        const nextEmail = profile.email ?? ''
        const nextRole = profile.role ?? 'user'

        setFullname(nextFullname)
        setUsername(nextUsername)
        setEmail(nextEmail)
        setRole(nextRole)

        if (nextEmail) {
          setUser({
            id: profile.id ?? authUser?.id ?? 'me',
            fullname: nextFullname,
            name: profile.name,
            username: nextUsername,
            email: nextEmail,
            role: nextRole,
          })
        }
      } catch (requestError) {
        hydrateFromStore()

        if (isAxiosError<ApiErrorPayload>(requestError)) {
          const apiMessage = requestError.response?.data?.message
          setError(apiMessage ?? 'Gagal memuat profil dari server.')
        } else {
          setError('Gagal memuat profil dari server.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void loadProfile()
  }, [authUser?.email, authUser?.fullname, authUser?.id, authUser?.name, authUser?.role, authUser?.username, setUser])

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    const payload = {
      fullname: fullname.trim(),
      username: username.trim(),
      email: email.trim(),
    }

    const formData = new FormData()
    formData.append('fullname', payload.fullname)
    formData.append('username', payload.username)
    formData.append('email', payload.email)

    try {
      await api.put('/v1/profiles', formData, {
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      })

      setUser({
        id: authUser?.id ?? 'me',
        fullname: payload.fullname,
        username: payload.username,
        email: payload.email,
        role,
      })

      setSuccess('Profil berhasil diperbarui.')
    } catch (requestError) {
      if (isAxiosError<ApiErrorPayload>(requestError)) {
        const firstValidationError = requestError.response?.data?.errors
          ? Object.values(requestError.response.data.errors)[0]?.[0]
          : undefined

        const apiMessage = firstValidationError ?? requestError.response?.data?.message

        if (apiMessage?.toLowerCase().includes('email has already been taken')) {
          setError('Backend menolak update karena validasi email duplikat. Rule update email di backend perlu disesuaikan (ignore user saat ini).')
        } else {
          setError(apiMessage ?? 'Gagal menyimpan profil.')
        }
      } else {
        setError('Gagal menyimpan profil. Cek endpoint update profile pada backend.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AppShell>
      <div className="rounded-[40px] border-[5px] border-white bg-gradient-to-b from-white to-slate-50 p-8 shadow-[0px_30px_30px_-20px_rgba(15,23,42,0.16)] sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Profile</p>
            <h1 className="mt-2 text-3xl font-black text-slate-800">Pengaturan Profil</h1>
            <p className="mt-1 text-sm text-slate-500">Perbarui data akun yang digunakan untuk mengelola konten.</p>
          </div>

          <div className="rounded-[24px] border-2 border-white bg-white px-5 py-3 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.15)]">
            <p className="text-sm font-bold text-slate-800">{headerName}</p>
            <p className="text-xs uppercase text-slate-500">{role}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-8 rounded-[24px] border-2 border-white bg-white p-6 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)]">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Full Name</span>
              <input
                type="text"
                value={fullname}
                onChange={(event) => setFullname(event.target.value)}
                className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                disabled={isLoading || isSaving}
                required
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Username</span>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                disabled={isLoading || isSaving}
                required
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700 sm:col-span-2">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                disabled={isLoading || isSaving}
                required
              />
            </label>
          </div>

          {error ? <p className="mt-4 text-sm font-semibold text-rose-600">{error}</p> : null}
          {success ? <p className="mt-4 text-sm font-semibold text-emerald-600">{success}</p> : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">{isLoading ? 'Memuat data profil...' : 'Data tersinkron dengan sesi login.'}</p>
            <button
              type="submit"
              disabled={isLoading || isSaving}
              className="inline-flex items-center justify-center rounded-[16px] bg-slate-800 px-4 py-2.5 text-sm font-bold text-white shadow-[0px_10px_15px_-10px_rgba(15,23,42,0.4)] transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </form>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link
            to="/dashboard"
            className="rounded-[20px] border-2 border-white bg-slate-50 px-4 py-3 text-center font-semibold text-slate-700 transition-all hover:bg-white hover:shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.12)]"
          >
            Kembali ke Dashboard
          </Link>
          <Link
            to="/users"
            className="rounded-[20px] border-2 border-white bg-slate-50 px-4 py-3 text-center font-semibold text-slate-700 transition-all hover:bg-white hover:shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.12)]"
          >
            Lihat Users
          </Link>
        </div>
      </div>
    </AppShell>
  )
}

export default ProfilePage
