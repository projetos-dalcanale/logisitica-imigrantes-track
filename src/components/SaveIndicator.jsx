import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CircleAlert, CloudCheck, LoaderCircle } from 'lucide-react'
import { useSaveStatus } from '../lib/saveStatus'

// "Salvando…" enquanto há gravação em andamento e "Salvo" por alguns
// segundos depois — confirma que o salvamento automático funcionou.
export default function SaveIndicator() {
  const { pending, lastSavedAt, error } = useSaveStatus()
  // Qual salvamento já teve o "Salvo" escondido (some 2,5 s depois).
  const [expirado, setExpirado] = useState(0)
  const recent = lastSavedAt > 0 && expirado !== lastSavedAt

  useEffect(() => {
    if (!lastSavedAt) return
    const t = setTimeout(() => setExpirado(lastSavedAt), 2500)
    return () => clearTimeout(t)
  }, [lastSavedAt])

  let content = null
  if (pending > 0) content = { key: 'saving', icon: LoaderCircle, text: 'Salvando…', cls: 'text-slate-500', spin: true }
  else if (error) content = { key: 'error', icon: CircleAlert, text: 'Erro ao salvar', cls: 'text-red-400' }
  else if (recent) content = { key: 'saved', icon: CloudCheck, text: 'Salvo', cls: 'text-emerald-500' }

  return (
    <div className="h-5 min-w-20" aria-live="polite">
      <AnimatePresence mode="wait">
        {content && (
          <motion.span
            key={content.key}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.15 }}
            className={`inline-flex items-center gap-1.5 text-xs font-medium ${content.cls}`}
          >
            <content.icon className={`size-3.5 ${content.spin ? 'animate-spin' : ''}`} strokeWidth={2.25} />
            {content.text}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
