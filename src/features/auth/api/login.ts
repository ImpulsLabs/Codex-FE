import api from '../../../lib/axios'
import type { AuthResponse, LoginPayload } from '../types'

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/v1/auth/login', payload)
  return data
}
