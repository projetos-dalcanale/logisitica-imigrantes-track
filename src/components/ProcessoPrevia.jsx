import { Check, StickyNote } from 'lucide-react'
import { ExportIcon, ImportIcon } from './ui/icons'
import { TOM_TEXTO } from './ProcessCard'
import { previaDoProcesso } from '../lib/previa'

// Conteúdo do cartão que aparece ao passar o mouse numa linha da tabela:
// próxima ação, etapas, contêineres com motorista e as observações.
export default function ProcessoPrevia({ proc, now }) {
  const v = previaDoProcesso(proc, now)
  const Icon = v.tipo === 'import' ? ImportIcon : ExportIcon
  return (
    <div className="space-y-3 text-[13px]">
      <div>
        <div className="mb-0.5 flex items-center gap-1.5 text-[12px] font-medium text-slate-400">
          <Icon className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
          {v.tipo === 'import' ? 'Importação' : 'Exportação'}
        </div>
        <p className="font-display text-[16px] font-semibold leading-tight tracking-[-0.015em] text-ink">{v.titulo}</p>
        <p className={`mt-1 font-medium ${TOM_TEXTO[v.acao.tom]}`}>{v.acao.texto}</p>
      </div>

      {v.etapas.length > 0 && (
        <ul className="space-y-0.5">
          {v.etapas.map((e) => {
            const feita = e.total > 0 && e.feitos === e.total
            return (
              <li key={e.label} className="flex items-center gap-2">
                <Check className={`size-3.5 shrink-0 ${feita ? 'text-emerald-500' : 'text-slate-500/40'}`} strokeWidth={3} aria-hidden="true" />
                <span className={feita ? 'text-slate-400' : 'text-ink'}>{e.label}</span>
                {e.total > 1 && <span className="ml-auto tabular-nums text-slate-500">{e.feitos}/{e.total}</span>}
              </li>
            )
          })}
        </ul>
      )}

      {v.containers.length > 0 && (
        <ul className="space-y-1 border-t border-slate-700/80 pt-2.5">
          {v.containers.map((c, i) => (
            <li key={i} className="flex items-baseline gap-2">
              <span className="font-mono text-[12px] text-ink">{c.rotulo}</span>
              <span className="min-w-0 flex-1 truncate text-slate-400">{[c.motorista, c.placas].filter(Boolean).join(' · ')}</span>
              <span className="tabular-nums text-slate-500">{c.etapas}</span>
            </li>
          ))}
          {v.restantes > 0 && <li className="text-slate-500">e mais {v.restantes}</li>}
        </ul>
      )}

      {v.observacoes && (
        <p className="flex items-start gap-1.5 border-t border-slate-700/80 pt-2.5 text-slate-400">
          <StickyNote className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
          <span>{v.observacoes}</span>
        </p>
      )}
    </div>
  )
}
