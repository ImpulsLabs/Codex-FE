import api from '../../../lib/axios'
import type { AuthResponse, RegisterPayload, User } from '../types'

type RegisterApiUser = User & {
  accessToken?: string
}

type RegisterApiResponse = {
  message: string
  user: RegisterApiUser
}

const buildRegisterFormData = (payload: RegisterPayload) => {
  const formData = new FormData()
  formData.append('fullname', payload.fullname.trim())
  formData.append('username', payload.username.trim())
  formData.append('email', payload.email.trim())
  formData.append('password', payload.password)
  return formData
}

const mapRegisterUser = (user: RegisterApiUser): User => {
  const userWithoutToken = { ...user }
  delete userWithoutToken.accessToken

  return {
    ...userWithoutToken,
    id: userWithoutToken.id ?? userWithoutToken.username ?? userWithoutToken.email,
    role: userWithoutToken.role ?? 'author',
  }
}

export const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const formData = buildRegisterFormData(payload)
  const { data } = await api.post<RegisterApiResponse>('/v1/auth/register', formData, {
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  })

  const token = data.user?.accessToken

  if (!token) {
    throw new Error('Token register tidak ditemukan pada response backend')
  }

  return {
    token,
    user: mapRegisterUser(data.user),
  }
}
