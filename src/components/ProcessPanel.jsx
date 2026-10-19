import { motion } from 'motion/react'
import { X } from 'lucide-react'
import SaveIndicator from './SaveIndicator'
import ProcessFicha from './ficha/ProcessFicha'
import { IconButton } from './ui/Tooltip'

// PAINEL LATERAL: a ficha do processo ao lado da lista (tela larga). Clicar em
// outro processo da lista troca o conteúdo sem fechar o painel. Não é um
// "dialog": a lista e os atalhos de teclado continuam valendo.
export default function ProcessPanel({ proc, processes, onClose, onEnviarStatus }) {
  return (
    <motion.aside
      aria-label="Detalhes do processo"
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 28, transition: { duration: 0.14 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 38, mass: 0.7 }}
      onKeyDown={(e) => e.key === 'Escape' && !e.defaultPrevented && onClose()}
      className="hairline-r relative z-20 flex h-full w-[clamp(520px,38vw,680px)] shrink-0 flex-col border-l border-slate-700/80 bg-navy-900 shadow-lift"
    >
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 px-4">
        <SaveIndicator />
        <IconButton icon={X} label="Fechar detalhes" shortcut="Esc" onClick={onClose} />
      </header>
      <ProcessFicha key={proc.id} proc={proc} processes={processes} onClose={onClose} onEnviarStatus={onEnviarStatus} />
    </motion.aside>
  )
}
