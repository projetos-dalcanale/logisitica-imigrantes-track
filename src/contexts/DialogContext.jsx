import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { CircleAlert, Pencil, Trash2 } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'

const DialogContext = createContext(null)

// Janelas de confirmação e de digitação no visual do app, no lugar do
// confirm()/prompt() do navegador. Uso: `if (await confirm({...}))`,
// `const nome = await prompt({...})` (null se cancelar).
export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null)
  const resolver = useRef(null)

  const open = useCallback(
    (config) =>
      new Promise((resolve) => {
        resolver.current = resolve
        setDialog(config)
      }),
    []
  )

  const close = (value) => {
    resolver.current?.(value)
    resolver.current = null
    setDialog(null)
  }

  const confirm = useCallback((opts) => open({ kind: 'confirm', ...opts }), [open])
  const prompt = useCallback((opts) => open({ kind: 'prompt', ...opts }), [open])

  return (
    <DialogContext.Provider value={{ confirm, prompt }}>
      {children}
      <AnimatePresence>
        {dialog && (
          <DialogView key="dialog" dialog={dialog} onClose={close} />
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  )
}

function DialogView({ dialog, onClose }) {
  const isPrompt = dialog.kind === 'prompt'
  const cancelValue = isPrompt ? null : false
  const [text, setText] = useState(dialog.defaultValue || '')
  const tone = dialog.danger ? 'danger' : isPrompt ? 'edit' : 'warn'
  const Icon = tone === 'danger' ? Trash2 : tone === 'edit' ? Pencil : CircleAlert
  const iconBg = tone === 'danger' ? 'bg-red-400/12 text-red-400' : tone === 'edit' ? 'bg-blue-600/10 text-blue-500' : 'bg-yellow-500/12 text-yellow-500'

  const submit = (e) => {
    e?.preventDefault()
    if (isPrompt) {
      const v = text.trim()
      if (!v) return
      onClose(v.slice(0, dialog.maxLength || 150))
    } else {
      onClose(true)
    }
  }

  return (
    <Modal onClose={() => onClose(cancelValue)} title={dialog.title} size="sm">
      <form onSubmit={submit} className="p-6">
        <div className="flex gap-4">
          <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
            <Icon className="size-5" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="text-[17px] font-semibold tracking-tight text-ink">{dialog.title}</h2>
            {dialog.message && <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{dialog.message}</p>}
            {isPrompt && (
              <input
                data-autofocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={dialog.placeholder}
                maxLength={dialog.maxLength || 150}
                className="field mt-4"
              />
            )}
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => onClose(cancelValue)}>
            {dialog.cancelLabel || 'Cancelar'}
          </Button>
          <Button type="submit" variant={dialog.danger ? 'dangerSolid' : 'primary'} disabled={isPrompt && !text.trim()} data-autofocus={isPrompt ? undefined : true}>
            {dialog.confirmLabel || (isPrompt ? 'Salvar' : 'Confirmar')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function useDialog() {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error('useDialog precisa estar dentro de <DialogProvider>')
  return ctx
}
