// Linha do tempo vertical, no estilo de rastreio de encomenda: um marcador
// por etapa, ligados por uma linha que fica verde no trecho já percorrido.
export function Timeline({ children }) {
  return <ol className="px-4 py-1">{children}</ol>
}

// `node` é o marcador (uma Checkbox). `atual` destaca a etapa
// da vez; `alvo` (id do marcador) faz o texto ser o rótulo dele: clicar no
// nome da etapa marca a etapa, inclusive para leitores de tela.
export function TimelineItem({ node, done, atual, last, title, subtitle, subtitleClass = 'text-slate-500', alvo, children }) {
  return (
    <li className="flex gap-3.5">
      <div className="flex flex-col items-center pt-[13px]">
        <span className="relative flex">
          {atual && <span className="absolute -inset-[5px] animate-pulse rounded-full bg-slate-500/20" />}
          {node}
        </span>
        {!last && <span className={`-mb-[13px] mt-1.5 w-0.5 flex-1 rounded-full transition-colors ${done ? 'bg-emerald-500/60' : 'bg-slate-500/20'}`} />}
      </div>
      <div className="flex min-h-12 min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-1.5 py-2.5">
        <label htmlFor={alvo} className={`block min-w-0 ${alvo ? 'cursor-pointer' : ''}`}>
          <div className={`text-[15px] leading-snug transition-colors ${done ? 'text-slate-500' : 'text-ink'} ${atual ? 'font-semibold' : ''}`}>{title}</div>
          {subtitle && <div className={`mt-0.5 text-[12px] font-medium ${subtitleClass}`}>{subtitle}</div>}
        </label>
        {children}
      </div>
    </li>
  )
}
