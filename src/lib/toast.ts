export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  message: string
  type: ToastType
}

type ToastListener = (toast: ToastItem) => void

let toastId = 0
const listeners = new Set<ToastListener>()

const publish = (message: string, type: ToastType) => {
  const item = { id: ++toastId, message, type }
  listeners.forEach((listener) => listener(item))
}

export const toast = {
  success: (message: string) => publish(message, 'success'),
  error: (message: string) => publish(message, 'error'),
  info: (message: string) => publish(message, 'info'),
}

export const subscribeToToast = (listener: ToastListener) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
