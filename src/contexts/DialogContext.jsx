import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import Modal from '../components/ui/Modal'

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
    <Modal onClose={() => onClose(cancelValue)} title={dialog.title} size="alert" className="bg-navy-800/90! backdrop-blur-2xl">
      <form onSubmit={submit}>
        <div className="px-4 pb-4 pt-5 text-center">
          <h2 className="text-[17px] font-semibold leading-snug text-ink">{dialog.title}</h2>
          {dialog.message && <p className="mt-1 text-[13px] leading-snug text-ink/80">{dialog.message}</p>}
          {isPrompt && (
            <input
              data-autofocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={dialog.placeholder}
              maxLength={dialog.maxLength || 150}
              className="field field-sm mt-3.5 bg-navy-800! text-left"
            />
          )}
        </div>
        <div className="hairline-t grid grid-cols-2">
          <button type="button" onClick={() => onClose(cancelValue)} className="hairline-r h-11 text-[17px] text-blue-500 transition-colors hover:bg-slate-500/10 active:bg-slate-500/20">
            {dialog.cancelLabel || 'Cancelar'}
          </button>
          <button
            type="submit"
            disabled={isPrompt && !text.trim()}
            data-autofocus={isPrompt ? undefined : true}
            className={`h-11 text-[17px] font-semibold transition-colors hover:bg-slate-500/10 active:bg-slate-500/20 disabled:opacity-40 ${dialog.danger ? 'text-red-500' : 'text-blue-500'}`}
          >
            {dialog.confirmLabel || (isPrompt ? 'Salvar' : 'Confirmar')}
          </button>
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
