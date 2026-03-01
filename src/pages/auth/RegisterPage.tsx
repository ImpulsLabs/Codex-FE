import { RegisterForm } from '../../features/auth'
import { AuthLayout } from '../../layouts/AuthLayout'

const RegisterPage = () => {
  return (
    <AuthLayout title="Daftar">
      <RegisterForm />
    </AuthLayout>
  )
}

export default RegisterPage
