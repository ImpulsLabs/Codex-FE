import api from '../../../lib/axios'

export const logout = async (): Promise<void> => {
  await api.post('/v1/auth/logout')
}
