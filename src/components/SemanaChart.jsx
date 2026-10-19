import { useState } from 'react'
import { compromissosPorDia } from '../lib/semana'
import Compromisso from './Compromisso'

const ALTURA_MAX = 88 // px da barra do dia mais cheio
const MAX_ITENS = 4

const plural = (n) => `${n} ${n === 1 ? 'compromisso' : 'compromissos'}`

// PRÓXIMOS 7 DIAS: uma coluna por dia (importação e exportação empilhadas) e,
// ao clicar num dia, a lista do que acontece nele. Sem biblioteca de gráfico.
export default function SemanaChart({ processes, now, onOpen }) {
  const dias = compromissosPorDia(processes, now)
  const [escolhido, setEscolhido] = useState(0)
  const dia = dias[escolhido]
  const maior = Math.max(1, ...dias.map((d) => d.total))
  const altura = (n) => (n ? Math.max(6, Math.round((n / maior) * ALTURA_MAX)) : 0)

  return (
    <section aria-labelledby="semana-titulo">
      <div className="mb-1.5 flex items-baseline justify-between gap-2 px-1">
        <h2 id="semana-titulo" className="font-display text-[17px] font-semibold tracking-[-0.015em] text-ink">Próximos 7 dias</h2>
        <span className="flex items-center gap-3 text-[12px] text-slate-500">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-blue-500" aria-hidden="true" />Importação</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-slate-500/55" aria-hidden="true" />Exportação</span>
        </span>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-end gap-1 px-3 pb-2 pt-4">
          {dias.map((d, i) => {
            const ativo = i === escolhido
            return (
              <button
                key={d.inicio}
                type="button"
                aria-pressed={ativo}
                aria-label={`${d.rotulo}: ${plural(d.total)}`}
                onClick={() => setEscolhido(i)}
                className={`flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl px-1 pb-2 pt-2 transition-colors ${ativo ? 'bg-navy-700/60' : 'hover:bg-navy-700/30'}`}
              >
                <span className={`text-[13px] font-semibold tabular-nums ${d.total ? 'text-ink' : 'text-slate-500'}`}>{d.total}</span>
                <span className="flex w-full max-w-9 flex-col justify-end" style={{ height: ALTURA_MAX }} aria-hidden="true">
                  {d.total === 0 ? (
                    <span className="h-[3px] w-full rounded-full bg-slate-500/20" />
                  ) : (
                    <>
                      {d.exportacao > 0 && <span className="w-full rounded-t-md bg-slate-500/55" style={{ height: altura(d.exportacao) }} />}
                      {d.importacao > 0 && <span className={`w-full bg-blue-500 ${d.exportacao ? '' : 'rounded-t-md'} rounded-b-md`} style={{ height: altura(d.importacao) }} />}
                    </>
                  )}
                </span>
                <span className="text-center leading-tight">
                  <span className={`block text-[12px] font-semibold ${d.hoje ? 'text-blue-500' : 'text-slate-400'}`}>{d.hoje ? 'hoje' : d.rotulo.slice(0, 3)}</span>
                  <span className="block text-[11px] tabular-nums text-slate-500">{d.rotulo.slice(4)}</span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="hairline-t">
          <p className="px-4 pb-1 pt-2.5 text-[12.5px] font-medium text-slate-400">{dia.hoje ? 'Hoje' : dia.rotulo} · {plural(dia.total)}</p>
          {dia.itens.length ? (
            <div className="divide-y divide-slate-700/80">
              {dia.itens.slice(0, MAX_ITENS).map((item, i) => (
                <Compromisso key={`${item.proc.id}-${item.rotulo}-${item.numero}-${i}`} item={item} onOpen={onOpen} now={now} />
              ))}
              {dia.itens.length > MAX_ITENS && <p className="px-4 py-2 text-[12.5px] text-slate-500">e mais {dia.itens.length - MAX_ITENS}</p>}
            </div>
          ) : (
            <p className="px-4 pb-4 pt-1 text-[14px] text-slate-500">Nada agendado para este dia.</p>
          )}
        </div>
      </div>
    </section>
  )
}
