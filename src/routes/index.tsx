import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from './RouteGuards'

const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'))
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'))
const PostsPage = lazy(() => import('../pages/posts/PostsPage'))
const CategoriesPage = lazy(() => import('../pages/categories/CategoriesPage'))
const CommentsPage = lazy(() => import('../pages/comments/CommentsPage'))
const UsersPage = lazy(() => import('../pages/users/UsersPage'))
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'))
const HomePage = lazy(() => import('../pages/public/HomePage'))
const ArticleDetailPage = lazy(() => import('../pages/public/ArticleDetailPage'))

const withPageLoader = (page: ReactNode) => {
  return <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>{page}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: withPageLoader(<HomePage />),
  },
  {
    path: '/articles/:slug',
    element: withPageLoader(<ArticleDetailPage />),
  },
  {
    path: '/login',
    element: withPageLoader(
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>,
    ),
  },
  {
    path: '/register',
    element: withPageLoader(
      <PublicOnlyRoute>
        <RegisterPage />
      </PublicOnlyRoute>,
    ),
  },
  {
    path: '/dashboard',
    element: withPageLoader(
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>,
    ),
  },
  {
    path: '/posts',
    element: withPageLoader(
      <ProtectedRoute>
        <PostsPage />
      </ProtectedRoute>,
    ),
  },
  {
    path: '/categories',
    element: withPageLoader(
      <ProtectedRoute>
        <CategoriesPage />
      </ProtectedRoute>,
    ),
  },
  {
    path: '/comments',
    element: withPageLoader(
      <ProtectedRoute>
        <CommentsPage />
      </ProtectedRoute>,
    ),
  },
  {
    path: '/users',
    element: withPageLoader(
      <ProtectedRoute>
        <UsersPage />
      </ProtectedRoute>,
    ),
  },
  {
    path: '/profile',
    element: withPageLoader(
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>,
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
