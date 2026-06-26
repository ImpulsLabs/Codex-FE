import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '../stores/authStore'

export const PublicOnlyRoute = ({ children }: { children: ReactNode }) => {
  const token = useAuthStore((state) => state.token)

  if (token) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const token = useAuthStore((state) => state.token)

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}
