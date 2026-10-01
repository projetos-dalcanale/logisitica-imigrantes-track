import { Archive, ArrowDownToLine, ArrowUpFromLine, CalendarClock, CircleCheck, Clock, Layers, TriangleAlert } from 'lucide-react'
import { getDraftDeadlineInfo, getProcessProgress } from '../lib/processos'

function Stat({ icon: Icon, label, value, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-slate-500/10 text-slate-400',
    success: 'bg-emerald-600/10 text-emerald-500',
    warn: 'bg-yellow-500/12 text-yellow-500',
    danger: 'bg-blue-600/10 text-blue-600',
  }
  return (
    <div className="card flex items-center gap-3 px-3.5 py-3 sm:px-4 sm:py-3.5">
      <div className={`hidden size-10 shrink-0 items-center justify-center rounded-xl sm:flex ${tones[tone]}`}>
        <Icon className="size-5" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-bold leading-none tracking-tight tabular-nums text-ink sm:text-2xl">{value}</div>
        <div className="mt-1 text-[11px] font-medium leading-tight text-slate-500 sm:text-xs">{label}</div>
      </div>
    </div>
  )
}

// Algum agendamento de carregamento nas próximas 24 h (e ainda não passado)?
const carregaEm24h = (proc, now) =>
  (proc.containers || []).some((c) => {
    const t = new Date(c.checklist?.ag_carga || '').getTime()
    return !isNaN(t) && t >= now && t - now <= 86400000
  })

// Resumo no topo, sempre contando só a aba selecionada. Prazo de Draft só
// existe na exportação; na importação o foco é carregamento e conclusão.
export default function ResumoBar({ processes, tab, now }) {
  let stats
  if (tab === 'archive') {
    const arq = processes.filter((p) => p.status === 'archived')
    stats = [
      { icon: Archive, label: 'Arquivados', value: arq.length },
      { icon: ArrowDownToLine, label: 'Importações', value: arq.filter((p) => p.type === 'import').length },
      { icon: ArrowUpFromLine, label: 'Exportações', value: arq.filter((p) => p.type === 'export').length },
    ]
  } else if (tab === 'import') {
    const ativos = processes.filter((p) => p.status === 'active' && p.type === 'import')
    const prontos = ativos.filter((p) => getProcessProgress(p) === 100).length
    const proximos = ativos.filter((p) => carregaEm24h(p, now)).length
    stats = [
      { icon: Layers, label: 'Em andamento', value: ativos.length },
      { icon: CalendarClock, label: 'Carregam em 24 h', value: proximos, tone: proximos ? 'warn' : 'neutral' },
      { icon: CircleCheck, label: 'Prontos p/ arquivar', value: prontos, tone: prontos ? 'success' : 'neutral' },
    ]
  } else {
    const ativos = processes.filter((p) => p.status === 'active' && p.type === 'export')
    let prazo = 0
    let atrasados = 0
    ativos.forEach((proc) => {
      const info = getDraftDeadlineInfo(proc, now)
      if (!info) return
      if (info.nivel === 'atrasado') atrasados++
      else prazo++
    })
    stats = [
      { icon: Layers, label: 'Em andamento', value: ativos.length },
      { icon: Clock, label: 'Draft em até 3 dias', value: prazo, tone: prazo ? 'warn' : 'neutral' },
      { icon: TriangleAlert, label: 'Draft atrasado', value: atrasados, tone: atrasados ? 'danger' : 'neutral' },
    ]
  }

  return (
    <div className="mb-5 grid grid-cols-3 gap-2.5 sm:gap-3">
      {stats.map((s) => (
        <Stat key={s.label} {...s} />
      ))}
    </div>
  )
}
