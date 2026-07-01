import { useEffect, useState } from 'react'
import { subscribeToToast, type ToastItem } from '../lib/toast'

export const ToastContainer = () => {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    const handler = (toast: ToastItem) => {
      setItems((current) => [...current, toast])
      setTimeout(() => {
        setItems((current) => current.filter((t) => t.id !== toast.id))
      }, 4000)
    }
    return subscribeToToast(handler)
  }, [])

  if (items.length === 0) return null

  return (
    <div aria-live="polite" className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className={`animate-slide-up rounded-[20px] border-2 border-white px-5 py-3.5 text-sm font-bold shadow-[0px_15px_25px_-10px_rgba(15,23,42,0.25)] backdrop-blur-md ${
            item.type === 'success'
              ? 'bg-emerald-600/95 text-white'
              : item.type === 'error'
                ? 'bg-rose-600/95 text-white'
                : 'bg-slate-800/95 text-white'
          }`}
        >
          {item.message}
        </div>
      ))}
    </div>
  )
}
