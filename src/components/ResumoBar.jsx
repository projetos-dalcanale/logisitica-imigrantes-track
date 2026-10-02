import { Archive, ArrowDownToLine, ArrowUpFromLine, CalendarClock, CircleCheck, Clock, Layers, TriangleAlert } from 'lucide-react'
import { getDraftDeadlineInfo, getProcessProgress } from '../lib/processos'

const TONS = {
  neutral: 'bg-slate-500',
  blue: 'bg-blue-500',
  success: 'bg-emerald-500',
  warn: 'bg-yellow-500',
  danger: 'bg-red-500',
}

// Indicador no estilo dos widgets do iOS: ícone num círculo colorido,
// número grande e legenda.
function Stat({ icon: Icon, label, value, tone = 'neutral' }) {
  return (
    <div className="card flex flex-col gap-2.5 p-3.5 sm:p-4">
      <span className={`flex size-7 items-center justify-center rounded-full text-white ${value ? TONS[tone] : 'bg-slate-500/40'}`}>
        <Icon className="size-3.5" strokeWidth={2.4} />
      </span>
      <div>
        <div className="font-display text-[26px] font-bold leading-none tracking-tight tabular-nums text-ink">{value}</div>
        <div className="mt-1 text-[12.5px] font-medium leading-tight text-slate-400">{label}</div>
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
      { icon: Archive, label: 'Arquivados', value: arq.length, tone: 'neutral' },
      { icon: ArrowDownToLine, label: 'Importações', value: arq.filter((p) => p.type === 'import').length, tone: 'blue' },
      { icon: ArrowUpFromLine, label: 'Exportações', value: arq.filter((p) => p.type === 'export').length, tone: 'blue' },
    ]
  } else if (tab === 'import') {
    const ativos = processes.filter((p) => p.status === 'active' && p.type === 'import')
    stats = [
      { icon: Layers, label: 'Em andamento', value: ativos.length, tone: 'blue' },
      { icon: CalendarClock, label: 'Carregam em 24 h', value: ativos.filter((p) => carregaEm24h(p, now)).length, tone: 'warn' },
      { icon: CircleCheck, label: 'Prontos p/ arquivar', value: ativos.filter((p) => getProcessProgress(p) === 100).length, tone: 'success' },
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
      { icon: Layers, label: 'Em andamento', value: ativos.length, tone: 'blue' },
      { icon: Clock, label: 'Draft em até 3 dias', value: prazo, tone: 'warn' },
      { icon: TriangleAlert, label: 'Draft atrasado', value: atrasados, tone: 'danger' },
    ]
  }

  return (
    <div className="mb-6 grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <Stat key={s.label} {...s} />
      ))}
    </div>
  )
}
