import { useState } from 'react'
import { Link } from 'react-router-dom'
import { login } from '../api/login'
import type { LoginPayload } from '../types'
import { useAuthStore } from '../../../stores/authStore'

export const LoginForm = () => {
  const setAuth = useAuthStore((state) => state.setAuth)

  const [loginValue, setLoginValue] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const buildLoginPayload = (): LoginPayload => {
    const value = loginValue.trim()

    if (value.includes('@')) {
      return {
        email: value,
        password,
      }
    }

    return {
      username: value,
      password,
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await login(buildLoginPayload())
      setAuth(response.token, response.user)
      localStorage.setItem('auth_token', response.token)
      setSuccess('Login berhasil!')
    } catch {
      setError('Login gagal!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto my-5 max-w-[550px] rounded-[40px] border-[5px] border-white bg-gradient-to-b from-white to-slate-50 px-[35px] py-[25px] shadow-[0px_30px_30px_-20px_rgba(15,23,42,0.16)]">
      <h1 className="text-center text-[30px] font-black text-slate-800">Login</h1>

      <form className="mt-5" onSubmit={handleSubmit}>
        <input
          id="login"
          type="text"
          value={loginValue}
          onChange={(event) => setLoginValue(event.target.value)}
          className="mt-[15px] w-full rounded-[20px] border-x-2 border-x-transparent bg-white px-5 py-[15px] text-sm text-slate-800 shadow-[0px_10px_10px_-5px_rgba(15,23,42,0.08)] outline-none placeholder:text-slate-400 focus:border-x-slate-400"
          placeholder="E-mail / Username"
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

        <span className="ml-[10px] mt-[10px] block text-[14px]">
          <a className="text-slate-600 no-underline hover:text-slate-800" href="#">
            Forgot Password ?
          </a>
        </span>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {success ? <p className="mt-3 text-sm text-emerald-600">{success}</p> : null}

        <button
          type="submit"
          className="mx-auto my-5 block w-full rounded-[20px] border-none bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-[15px] text-sm font-bold text-white shadow-[0px_20px_10px_-15px_rgba(15,23,42,0.38)] transition duration-200 hover:scale-[1.02] hover:shadow-[0px_23px_10px_-20px_rgba(15,23,42,0.45)] active:scale-95 active:shadow-[0px_15px_10px_-10px_rgba(15,23,42,0.35)] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        Belum punya akun?{' '}
        <Link className="font-medium text-slate-700 hover:text-slate-900 hover:underline" to="/register">
          Register
        </Link>
      </p>
    </div>
  )
}
