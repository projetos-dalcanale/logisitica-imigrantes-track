import { ChevronDown } from 'lucide-react'
import { motion } from 'motion/react'

// Seção recolhível no estilo das listas agrupadas (ver ui/List.jsx): o
// título é um botão que abre/fecha o bloco. Fechada, mostra o `resumo` ao
// lado do título. Controlada por quem usa (`aberta` + `onAlternar`), para o
// índice da ficha poder abrir uma seção por fora.
export default function Secao({ id, titulo, resumo, acao, footer, aberta, onAlternar, children, className = '' }) {
  const corpoId = `ficha-${id}-corpo`
  return (
    <section id={`ficha-${id}`} data-secao={id} className={`scroll-mt-14 ${className}`}>
      <div className="mb-1.5 flex min-h-6 items-end justify-between gap-3 px-4">
        <h3 className="min-w-0 text-[13px] font-medium">
          <button
            type="button"
            onClick={onAlternar}
            aria-expanded={aberta}
            aria-controls={corpoId}
            className="group -mx-1 flex max-w-full items-center gap-1 rounded px-1 text-left text-slate-400 transition-colors hover:text-ink"
          >
            <ChevronDown className={`size-3.5 shrink-0 text-slate-500 transition-transform duration-200 ${aberta ? '' : '-rotate-90'}`} strokeWidth={2.4} aria-hidden="true" />
            <span className="shrink-0">{titulo}</span>
            {!aberta && resumo && <span className="truncate font-normal text-slate-500">· {resumo}</span>}
          </button>
        </h3>
        {aberta && acao}
      </div>
      {/* O respiro (px/pb com margem negativa) evita cortar a sombra do bloco. */}
      <motion.div
        id={corpoId}
        initial={false}
        animate={{ height: aberta ? 'auto' : 0, opacity: aberta ? 1 : 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        inert={!aberta}
        className="-mx-2 -mb-3 overflow-hidden px-2 pb-3"
      >
        <div className="overflow-hidden rounded-xl bg-navy-800 shadow-soft">
          <div className="divide-y divide-slate-700/80 [&>*]:border-slate-700/80">{children}</div>
        </div>
        {footer && <p className="mt-1.5 px-4 text-xs leading-relaxed text-slate-500">{footer}</p>}
      </motion.div>
    </section>
  )
}
