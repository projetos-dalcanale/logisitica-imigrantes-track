import { createContext, useCallback, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CircleAlert, CircleCheck, Info } from 'lucide-react'

const ToastContext = createContext(null)

const TOAST_STYLES = {
  success: { icon: CircleCheck, color: 'text-emerald-500' },
  error: { icon: CircleAlert, color: 'text-red-400' },
  info: { icon: Info, color: 'text-blue-500' },
}

let nextId = 0

// NOTIFICAÇÕES RÁPIDAS (TOAST): feedback curto depois de uma ação, sem
// interromper o uso. Some sozinho. Embaixo no centro (celular) ou à direita.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success') => {
    const id = ++nextId
    setToasts((t) => [...t.slice(-2), { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 lg:bottom-5 lg:items-end lg:px-5">
        <AnimatePresence initial={false}>
          {toasts.map(({ id, message, type }) => {
            const cfg = TOAST_STYLES[type] || TOAST_STYLES.success
            const Icon = cfg.icon
            return (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                className="pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-full bg-navy-800/90 py-2.5 pl-3.5 pr-4 text-[14px] font-medium text-ink shadow-lift ring-[0.5px] ring-black/10 backdrop-blur-xl dark:ring-white/10"
              >
                <Icon className={`size-[18px] shrink-0 ${cfg.color}`} strokeWidth={2.25} />
                <span>{message}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>')
  return ctx
}
