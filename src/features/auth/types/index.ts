export interface User {
  id: number | string
  name?: string
  fullname?: string
  username?: string
  email: string
  role?: string
  accessToken?: string
}

export interface LoginPayload {
  user: string
  password: string
}

export interface RegisterPayload {
  fullname: string
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}
