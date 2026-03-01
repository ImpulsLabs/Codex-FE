import api from '../../../lib/axios'
import type { AuthResponse, LoginPayload, User } from '../types'

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const { data } = await api.post<{ token?: string; user: User }>('/v1/auth/login', payload)

  const token = data.token ?? data.user?.accessToken

  if (!token) {
    throw new Error('Token tidak ditemukan pada response login')
  }

  return {
    token,
    user: data.user,
  }
}
