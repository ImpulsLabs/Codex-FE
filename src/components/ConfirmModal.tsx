interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  variant?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  isLoading = false,
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[32px] border-[5px] border-white bg-gradient-to-b from-white to-slate-50 p-6 shadow-[0px_30px_30px_-20px_rgba(15,23,42,0.32)] sm:p-8">
        <h2 className="text-2xl font-black text-slate-800">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-[16px] bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-[16px] px-4 py-2.5 text-sm font-bold text-white shadow-[0px_10px_15px_-10px_rgba(15,23,42,0.4)] transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            {isLoading ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}