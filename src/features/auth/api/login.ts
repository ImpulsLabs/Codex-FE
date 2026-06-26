import api from '../../../lib/axios'
import type { AuthResponse, LoginPayload, User } from '../types'

type LoginApiUser = User & {
  accessToken?: string
}

type LoginApiResponse = {
  message: string
  user: LoginApiUser
}

const buildLoginFormData = (payload: LoginPayload) => {
  const formData = new FormData()
  formData.append('user', payload.user.trim())
  formData.append('password', payload.password)
  return formData
}

const mapLoginUser = (user: LoginApiUser): User => {
  const { accessToken: _accessToken, ...userWithoutToken } = user

  return {
    ...userWithoutToken,
    id: userWithoutToken.id ?? userWithoutToken.username ?? userWithoutToken.email,
    role: userWithoutToken.role ?? 'author',
  }
}

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const formData = buildLoginFormData(payload)
  const { data } = await api.post<LoginApiResponse>('/v1/auth/login', formData, {
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  })

  const token = data.user?.accessToken

  if (!token) {
    throw new Error('Token login tidak ditemukan pada response backend')
  }

  return {
    token,
    user: mapLoginUser(data.user),
  }
}
