import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(null)

const TOAST_STYLES = {
  success: { icon: 'fa-circle-check', classes: 'border-emerald-500 text-emerald-500' },
  error: { icon: 'fa-circle-exclamation', classes: 'border-red-400 text-red-400' },
  info: { icon: 'fa-circle-info', classes: 'border-blue-500 text-blue-500' },
}

let nextId = 0

// NOTIFICAÇÕES RÁPIDAS (TOAST): feedback curto depois de uma ação, no canto
// inferior direito, sem interromper o uso como um alert(). Some sozinho.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success') => {
    const id = ++nextId
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none max-w-[calc(100vw-2rem)]">
        {toasts.map(({ id, message, type }) => {
          const cfg = TOAST_STYLES[type] || TOAST_STYLES.success
          return (
            <div key={id} className={`toast-item pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-sm font-semibold bg-navy-800 ${cfg.classes}`}>
              <i className={`fas ${cfg.icon}`} />
              <span className="text-ink">{message}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>')
  return ctx
}
