import { LoginForm } from '../../features/auth'
import { AuthLayout } from '../../layouts/AuthLayout'

const LoginPage = () => {
  return (
    <AuthLayout title="Login">
      <LoginForm />
    </AuthLayout>
  )
}

export default LoginPage
