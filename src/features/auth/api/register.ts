import api from '../../../lib/axios'
import type { AuthResponse, RegisterPayload } from '../types'

export const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/v1/auth/register', payload)
  return data
}
