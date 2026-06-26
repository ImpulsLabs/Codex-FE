import { createBrowserRouter, Navigate } from 'react-router-dom'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import PostsPage from '../pages/posts/PostsPage'
import CategoriesPage from '../pages/categories/CategoriesPage'
import CommentsPage from '../pages/comments/CommentsPage'
import UsersPage from '../pages/users/UsersPage'
import ProfilePage from '../pages/profile/ProfilePage'
import HomePage from '../pages/public/HomePage'
import ArticleDetailPage from '../pages/public/ArticleDetailPage'
import { ProtectedRoute, PublicOnlyRoute } from './RouteGuards'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/articles/:slug',
    element: <ArticleDetailPage />,
  },
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicOnlyRoute>
        <RegisterPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/posts',
    element: (
      <ProtectedRoute>
        <PostsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/categories',
    element: (
      <ProtectedRoute>
        <CategoriesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/comments',
    element: (
      <ProtectedRoute>
        <CommentsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/users',
    element: (
      <ProtectedRoute>
        <UsersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
