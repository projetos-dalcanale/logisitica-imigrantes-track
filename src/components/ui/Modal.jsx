import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, usePresence } from 'motion/react'
import { Drawer } from 'vaul'
import { useIsPhone } from '../../hooks/useMediaQuery'

const SIZES = {
  alert: 'max-w-[300px] rounded-[18px]',
  sm: 'sm:max-w-[420px]',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
}

// Não joga o foco no primeiro botão (abriria a dica do "Fechar"): foca o
// elemento marcado com data-autofocus ou a própria janela.
const autoFocus = (e) => {
  e.preventDefault()
  const el = e.currentTarget
  const focar = () => (el.querySelector('[data-autofocus]') || el).focus({ preventScroll: true })
  focar()
  setTimeout(() => !el.contains(document.activeElement) && focar(), 30)
}

// No celular, as janelas marcadas como `sheet` viram uma folha que sobe de
// baixo e fecha arrastando para baixo, como no iOS.
// Quando quem usa remove a folha (botão OK, Fechar, salvar...), o
// <AnimatePresence> em volta a mantém na tela até ela terminar de descer.
function PhoneSheet({ onClose, title, description, grouped, children }) {
  const [open, setOpen] = useState(true) // false = fechada arrastando
  const [presente, liberar] = usePresence()

  // Já tinha descido (arrastada) quando foi removida: libera na hora.
  useEffect(() => {
    if (!presente && !open) liberar?.()
  }, [presente, open, liberar])

  const fimDaAnimacao = (aberta) => {
    if (aberta) return
    if (presente) onClose() // fechou arrastando: avisa quem usa
    else liberar?.() // removida por quem usa: terminou de descer
  }

  return (
    <Drawer.Root open={open && presente} onOpenChange={(o) => !o && setOpen(false)} onAnimationEnd={fimDaAnimacao}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content
          onOpenAutoFocus={autoFocus}
          className={`fixed inset-x-0 bottom-0 z-50 flex h-[94dvh] flex-col overflow-hidden rounded-t-[14px] outline-none ${grouped ? 'bg-navy-900' : 'bg-navy-800'}`}
        >
          <div aria-hidden className="mx-auto mb-1 mt-2 h-[5px] w-9 shrink-0 rounded-full bg-slate-500/40" />
          <Drawer.Title className="sr-only">{title}</Drawer.Title>
          <Drawer.Description className="sr-only">{description || title}</Drawer.Description>
          {children}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

// Janela modal acessível (foco preso dentro, Esc fecha, leitor de tela) com
// animação de entrada/saída. Para a animação de saída funcionar, quem usa
// renderiza o Modal dentro de <AnimatePresence> e o remove ao fechar.
// `sheet`: no celular vira folha deslizante. `grouped`: fundo cinza para
// conteúdo em listas agrupadas (estilo Ajustes do iPhone).
export default function Modal({ onClose, title, description, size = 'md', sheet = false, grouped = false, children, className = '' }) {
  const isPhone = useIsPhone()
  if (sheet && isPhone) {
    return <PhoneSheet onClose={onClose} title={title} description={description} grouped={grouped}>{children}</PhoneSheet>
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal forceMount>
        <Dialog.Overlay asChild forceMount>
          <motion.div
            className="fixed inset-0 z-50 bg-black/30 dark:bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        </Dialog.Overlay>
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Content asChild forceMount onOpenAutoFocus={autoFocus}>
            <motion.div
              tabIndex={-1}
              className={`pointer-events-auto relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl shadow-float outline-none ring-[0.5px] ring-black/5 dark:ring-white/10 ${grouped ? 'bg-navy-900' : 'bg-navy-800'} ${SIZES[size]} ${className}`}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 4, transition: { duration: 0.14 } }}
              transition={{ type: 'spring', stiffness: 460, damping: 36, mass: 0.7 }}
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

// Cabeçalho de folha no estilo iOS: ação à esquerda, título central, ação à direita.
export function SheetHeader({ title, subtitle, left, right }) {
  return (
    <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 pb-2.5 pt-2.5 sm:px-4 sm:pt-3.5">
      <div className="flex justify-start">{left}</div>
      <div className="min-w-0 text-center">
        <h2 className="truncate text-[15px] font-semibold text-ink">{title}</h2>
        {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex justify-end">{right}</div>
    </header>
  )
}
