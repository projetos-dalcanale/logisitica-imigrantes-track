import { getDraftDeadlineInfo } from '../lib/processos'

const boxClass = 'bg-navy-800 border border-slate-700 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3'
const valueClass = 'text-xl sm:text-2xl font-bold text-ink'

// Resumo no topo, sempre contando só a aba selecionada. "Prazo próximo" e
// "Atrasados" só existem na aba de Exportações (prazo de Draft).
export default function ResumoBar({ processes, tab, now }) {
  if (tab === 'archive') {
    return (
      <div className="grid grid-cols-1 gap-2.5 sm:gap-4 mb-4">
        <div className={boxClass}>
          <div className="text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Arquivados</div>
          <div className={valueClass}>{processes.filter((p) => p.status === 'archived').length}</div>
        </div>
      </div>
    )
  }

  const isExport = tab === 'export'
  const relevantes = processes.filter((p) => p.status === 'active' && p.type === tab)

  let prazoProximo = 0
  let atrasados = 0
  if (isExport) {
    relevantes.forEach((proc) => {
      const info = getDraftDeadlineInfo(proc, now)
      if (!info) return
      if (info.nivel === 'atrasado') atrasados++
      else prazoProximo++
    })
  }

  return (
    <div className={`grid ${isExport ? 'grid-cols-3' : 'grid-cols-1'} gap-2.5 sm:gap-4 mb-4`}>
      <div className={boxClass}>
        <div className="text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">
          {isExport ? 'Exportações em andamento' : 'Importações em andamento'}
        </div>
        <div className={valueClass}>{relevantes.length}</div>
      </div>
      {isExport && (
        <>
          <div className={boxClass}>
            <div className="text-[10px] sm:text-[11px] text-yellow-500 font-bold uppercase tracking-widest mb-0.5">Prazo próximo</div>
            <div className={valueClass}>{prazoProximo}</div>
          </div>
          <div className={boxClass}>
            <div className="text-[10px] sm:text-[11px] text-blue-600 font-bold uppercase tracking-widest mb-0.5">Atrasados</div>
            <div className={valueClass}>{atrasados}</div>
          </div>
        </>
      )}
    </div>
  )
}
