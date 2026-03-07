import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api',
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  const requestUrl = config.url ?? ''
  const isAuthEndpoint = ['/v1/auth/login', '/v1/auth/register'].some((path) => requestUrl.includes(path))

  if (token && !isAuthEndpoint) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default api
