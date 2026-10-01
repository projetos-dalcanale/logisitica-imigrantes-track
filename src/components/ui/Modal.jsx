import * as Dialog from '@radix-ui/react-dialog'
import { motion } from 'motion/react'

const SIZES = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-3xl',
  xl: 'sm:max-w-5xl',
}

// Janela modal acessível (foco preso dentro, Esc fecha, leitor de tela) com
// animação de entrada/saída. Para a animação de saída funcionar, quem usa
// renderiza o Modal dentro de <AnimatePresence> e o remove ao fechar.
// `fullscreenMobile`: no celular ocupa a tela toda, como uma tela de app.
export default function Modal({ onClose, title, description, size = 'md', fullscreenMobile = false, children, className = '' }) {
  const mobile = fullscreenMobile
    ? 'h-[100dvh] max-h-[100dvh] rounded-none sm:h-auto sm:max-h-[90vh] sm:rounded-[22px]'
    : 'max-h-[88vh] rounded-[22px] mx-4'

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal forceMount>
        <Dialog.Overlay asChild forceMount>
          <motion.div
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
        </Dialog.Overlay>
        <div className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none ${fullscreenMobile ? '' : 'p-0 sm:p-4'}`}>
          <Dialog.Content
            asChild
            forceMount
            // Não joga o foco no primeiro botão (abriria a dica do "Fechar"):
            // foca o elemento marcado com data-autofocus ou a própria janela.
            onOpenAutoFocus={(e) => {
              e.preventDefault()
              const el = e.currentTarget
              const focar = () => (el.querySelector('[data-autofocus]') || el).focus({ preventScroll: true })
              focar()
              setTimeout(() => !el.contains(document.activeElement) && focar(), 30)
            }}
          >
            <motion.div
              tabIndex={-1}
              className={`pointer-events-auto relative flex w-full flex-col overflow-hidden bg-navy-800 border border-slate-700/70 shadow-float outline-none ${SIZES[size]} ${mobile} ${className}`}
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 6 }}
              transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }}
            >
              <Dialog.Title className="sr-only">{title}</Dialog.Title>
              <Dialog.Description className="sr-only">{description || title}</Dialog.Description>
              {children}
            </motion.div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
