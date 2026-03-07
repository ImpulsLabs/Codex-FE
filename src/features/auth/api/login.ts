import api from '../../../lib/axios'
import type { AuthResponse, LoginPayload, User } from '../types'

type LoginApiResponse = {
  token?: string
  access_token?: string
  accessToken?: string
  plainTextToken?: string
  user?: User
  data?: {
    token?: string
    access_token?: string
    accessToken?: string
    plainTextToken?: string
    user?: User
  }
  authorization?: {
    token?: string
    access_token?: string
    accessToken?: string
  }
  authorisation?: {
    token?: string
    access_token?: string
    accessToken?: string
  }
}

type ProfileApiResponse = {
  user?: User
  data?: User | { user?: User }
}

const buildLoginFormData = (payload: LoginPayload) => {
  const formData = new FormData()
  formData.append('user', payload.user.trim())
  formData.append('password', payload.password)
  return formData
}

const cleanToken = (token?: string) => {
  if (!token) {
    return undefined
  }

  return token.replace(/^Bearer\s+/i, '').trim()
}

const extractTokenFromHeaders = (headers: Record<string, string | undefined>) => {
  const rawHeaderToken =
    headers.authorization ??
    headers.Authorization ??
    headers['x-auth-token'] ??
    headers['X-Auth-Token']

  return cleanToken(rawHeaderToken)
}

const findTokenRecursively = (value: unknown): string | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined
  }

  const record = value as Record<string, unknown>
  const directToken =
    cleanToken(typeof record.token === 'string' ? record.token : undefined) ??
    cleanToken(typeof record.access_token === 'string' ? record.access_token : undefined) ??
    cleanToken(typeof record.accessToken === 'string' ? record.accessToken : undefined) ??
    cleanToken(typeof record.plainTextToken === 'string' ? record.plainTextToken : undefined)

  if (directToken) {
    return directToken
  }

  for (const nestedValue of Object.values(record)) {
    const nestedToken = findTokenRecursively(nestedValue)
    if (nestedToken) {
      return nestedToken
    }
  }

  return undefined
}

const extractToken = (payload: LoginApiResponse, headers: Record<string, string | undefined>) => {
  return (
    cleanToken(payload.token) ??
    cleanToken(payload.access_token) ??
    cleanToken(payload.accessToken) ??
    cleanToken(payload.plainTextToken) ??
    cleanToken(payload.data?.token) ??
    cleanToken(payload.data?.access_token) ??
    cleanToken(payload.data?.accessToken) ??
    cleanToken(payload.data?.plainTextToken) ??
    cleanToken(payload.authorization?.token) ??
    cleanToken(payload.authorization?.access_token) ??
    cleanToken(payload.authorization?.accessToken) ??
    cleanToken(payload.authorisation?.token) ??
    cleanToken(payload.authorisation?.access_token) ??
    cleanToken(payload.authorisation?.accessToken) ??
    extractTokenFromHeaders(headers) ??
    findTokenRecursively(payload)
  )
}

const extractUser = (payload: LoginApiResponse) => {
  return payload.user ?? payload.data?.user
}

const fetchProfile = async (token: string): Promise<User | null> => {
  try {
    const { data } = await api.get<ProfileApiResponse>('/v1/profiles', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (data.user) {
      return data.user
    }

    if (data.data && 'user' in data.data && data.data.user) {
      return data.data.user
    }

    if (data.data && 'id' in data.data) {
      return data.data
    }

    return null
  } catch {
    return null
  }
}

const extractTokenAndUser = async (
  payload: LoginApiResponse,
  headers: Record<string, string | undefined>,
  loginValue: string,
): Promise<AuthResponse> => {
  const token = extractToken(payload, headers)

  if (!token) {
    throw new Error('Token tidak ditemukan pada response login')
  }

  const profileUser = await fetchProfile(token)
  const responseUser = extractUser(payload)
  const user = responseUser ?? profileUser

  if (!user) {
    return {
      token,
      user: {
        id: loginValue,
        email: loginValue.includes('@') ? loginValue : '',
        username: loginValue.includes('@') ? undefined : loginValue,
        role: 'user',
      },
    }
  }

  return { token, user }
}

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const formData = buildLoginFormData(payload)
  const response = await api.post<LoginApiResponse>('/v1/auth/login', formData, {
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  })

  const responseHeaders = response.headers as Record<string, string | undefined>
  return extractTokenAndUser(response.data, responseHeaders, payload.user.trim())
}
