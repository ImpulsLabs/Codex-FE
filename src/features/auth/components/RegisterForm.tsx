import { useState } from 'react'
import { isAxiosError } from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/register'
import { login } from '../api/login'
import { useAuthStore } from '../../../stores/authStore'

type ApiErrorPayload = {
  message?: string
  errors?: Record<string, string[]>
}

const resolveErrorMessage = (error: unknown) => {
  if (isAxiosError<ApiErrorPayload>(error)) {
    const responseData = error.response?.data

    if (responseData?.errors) {
      const firstError = Object.values(responseData.errors)[0]?.[0]

      if (firstError) {
        return firstError
      }
    }

    if (responseData?.message) {
      return responseData.message
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Register gagal!'
}

export const RegisterForm = () => {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [fullname, setFullname] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await register({
        fullname,
        username,
        email,
        password,
      })

      let authResponse

      try {
        authResponse = await login({
          user: username.trim(),
          password,
        })
      } catch (usernameLoginError) {
        if (username.trim().toLowerCase() === email.trim().toLowerCase()) {
          throw usernameLoginError
        }

        authResponse = await login({
          user: email.trim(),
          password,
        })
      }

      setAuth(authResponse.token, authResponse.user)
      setSuccess('Register berhasil! Mengarahkan ke dashboard...')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setError(resolveErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto my-5 max-w-[550px] rounded-[40px] border-[5px] border-white bg-gradient-to-b from-white to-slate-50 px-[35px] py-[25px] shadow-[0px_30px_30px_-20px_rgba(15,23,42,0.16)]">
      <h1 className="text-center text-[30px] font-black text-slate-800">Register</h1>

      <form className="mt-5" onSubmit={handleSubmit}>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="mt-[15px] w-full rounded-[20px] border-x-2 border-x-transparent bg-white px-5 py-[15px] text-sm text-slate-800 shadow-[0px_10px_10px_-5px_rgba(15,23,42,0.08)] outline-none placeholder:text-slate-400 focus:border-x-slate-400"
          placeholder="Username"
          required
        />

        <input
          id="fullname"
          type="text"
          value={fullname}
          onChange={(event) => setFullname(event.target.value)}
          className="mt-[15px] w-full rounded-[20px] border-x-2 border-x-transparent bg-white px-5 py-[15px] text-sm text-slate-800 shadow-[0px_10px_10px_-5px_rgba(15,23,42,0.08)] outline-none placeholder:text-slate-400 focus:border-x-slate-400"
          placeholder="Full Name"
          required
        />

        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-[15px] w-full rounded-[20px] border-x-2 border-x-transparent bg-white px-5 py-[15px] text-sm text-slate-800 shadow-[0px_10px_10px_-5px_rgba(15,23,42,0.08)] outline-none placeholder:text-slate-400 focus:border-x-slate-400"
          placeholder="E-mail"
          required
        />

        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-[15px] w-full rounded-[20px] border-x-2 border-x-transparent bg-white px-5 py-[15px] text-sm text-slate-800 shadow-[0px_10px_10px_-5px_rgba(15,23,42,0.08)] outline-none placeholder:text-slate-400 focus:border-x-slate-400"
          placeholder="Password"
          required
        />

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          {success ? <p className="mt-3 text-sm text-emerald-600">{success}</p> : null}

        <button
          type="submit"
          className="mx-auto my-5 block w-full rounded-[20px] border-none bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-[15px] text-sm font-bold text-white shadow-[0px_20px_10px_-15px_rgba(15,23,42,0.38)] transition duration-200 hover:scale-[1.02] hover:shadow-[0px_23px_10px_-20px_rgba(15,23,42,0.45)] active:scale-95 active:shadow-[0px_15px_10px_-10px_rgba(15,23,42,0.35)] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Register'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        Sudah punya akun?{' '}
        <Link className="font-medium text-slate-700 hover:text-slate-900 hover:underline" to="/login">
          Login
        </Link>
      </p>
    </div>
  )
}
