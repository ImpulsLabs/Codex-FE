export interface User {
  id: number | string
  name: string
  email: string
}

export interface LoginPayload {
  email?: string
  username?: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}
