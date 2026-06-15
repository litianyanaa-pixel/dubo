import { create } from 'zustand'

export interface ToastItem {
  id: string
  message: string
  type: 'success' | 'warning' | 'danger' | 'info'
}

interface ToastState {
  toasts: ToastItem[]
  addToast: (message: string, type?: ToastItem['type']) => void
  removeToast: (id: string) => void
}

let toastId = 0

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = `toast_${toastId++}`
    set({ toasts: [...get().toasts, { id, message, type }] })
    // Auto-remove after 4s
    setTimeout(() => get().removeToast(id), 4000)
  },
  removeToast: (id) => {
    set({ toasts: get().toasts.filter(t => t.id !== id) })
  },
}))

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-14 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2 rounded-lg border text-sm font-bold animate-toast-in pointer-events-auto ${
            t.type === 'success' ? 'bg-up/15 border-up/40 text-up'
            : t.type === 'danger' ? 'bg-danger/15 border-danger/40 text-danger'
            : t.type === 'warning' ? 'bg-warn/15 border-warn/40 text-warn'
            : 'bg-info/15 border-info/40 text-info'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
