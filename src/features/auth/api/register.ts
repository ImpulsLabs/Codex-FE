import api from '../../../lib/axios'
import type { RegisterPayload } from '../types'

const buildRegisterFormData = (payload: RegisterPayload) => {
  const formData = new FormData()
  formData.append('fullname', payload.fullname)
  formData.append('username', payload.username)
  formData.append('email', payload.email)
  formData.append('password', payload.password)
  return formData
}

export const register = async (payload: RegisterPayload): Promise<unknown> => {
  const formData = buildRegisterFormData(payload)
  const { data } = await api.post('/v1/auth/register', formData, {
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  })
  return data
}
