import { motion } from 'motion/react'
import { ArrowDownToLine, ArrowUpFromLine, CalendarCheck, CircleCheck, Clock, GripVertical, Ship, StickyNote, TriangleAlert, Truck, User } from 'lucide-react'
import {
  draftAlertConfig,
  formatarDataHoraCurta,
  getDraftDeadlineInfo,
  getProcessProgress,
} from '../lib/processos'
import Tooltip from './ui/Tooltip'

// Ícone do aviso de Deadline Draft conforme o nível (relógio ou alerta).
export function DraftIcon({ nivel, className }) {
  const Icon = draftAlertConfig[nivel].icon === 'alert' ? TriangleAlert : Clock
  return <Icon className={className} strokeWidth={2.5} />
}

// Cor da faixa de status à esquerda do card.
const statusAccent = (proc, draftInfo, done) => {
  if (proc.status === 'archived') return 'bg-slate-500/50'
  if (draftInfo) return { aviso: 'bg-yellow-500', atencao: 'bg-blue-400', urgente: 'bg-blue-600', atrasado: 'bg-blue-900' }[draftInfo.nivel]
  if (done) return 'bg-emerald-500'
  return 'bg-blue-500/70'
}

// Cartão de um processo. `dragHandle` (opcional) recebe as props do dnd-kit
// para o ícone de arrastar; sem ele o card não é reordenável.
export default function ProcessCard({ proc, now, onOpen, dragHandle, style, innerRef, dragging }) {
  const containers = proc.containers || []
  const isImport = proc.type === 'import'
  const title = isImport ? proc.importador : proc.exportador
  const docLabel = isImport ? proc.documentoTipo || 'Documento' : 'Booking'
  const docValue = isImport ? (proc.documentoTipo ? proc.documentoNumero : proc.documento) : proc.booking

  const validContainers = containers.filter((c) => c.numero !== '')
  const draftInfo = getDraftDeadlineInfo(proc, now)
  const agCarga = isImport ? containers.map((c) => c.checklist?.ag_carga).filter(Boolean).sort()[0] : null
  const agCargaTexto = formatarDataHoraCurta(agCarga)
  const progress = getProcessProgress(proc)
  const done = progress === 100

  return (
    <div
      ref={innerRef}
      style={style}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(proc.id)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen(proc.id))}
      className={`card group relative cursor-pointer overflow-hidden p-5 pl-6 outline-none transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-slate-600/80 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-blue-500/50 ${dragging ? 'shadow-float ring-2 ring-blue-500/30' : ''}`}
    >
      <span className={`absolute inset-y-3 left-0 w-1 rounded-r-full ${statusAccent(proc, draftInfo, done)}`} />

      {dragHandle && (
        <Tooltip label="Arrastar para reordenar">
          <div
            {...dragHandle}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-3 top-3 z-10 flex size-7 touch-none cursor-grab items-center justify-center rounded-lg text-slate-500 opacity-60 transition hover:bg-navy-700 hover:text-ink hover:opacity-100 active:cursor-grabbing group-hover:opacity-100"
          >
            <GripVertical className="size-4" />
          </div>
        </Tooltip>
      )}

      <div className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6 ${dragHandle ? 'sm:pr-8' : ''}`}>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-blue-500">
              {isImport ? <ArrowDownToLine className="size-3.5" strokeWidth={2.5} /> : <ArrowUpFromLine className="size-3.5" strokeWidth={2.5} />}
              {isImport ? 'Importação' : 'Exportação'}
            </span>
            {draftInfo && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${draftAlertConfig[draftInfo.nivel].badge}`}>
                <DraftIcon nivel={draftInfo.nivel} className="size-3" />
                {draftInfo.texto}
              </span>
            )}
            {proc.observacoes?.trim() && (
              <Tooltip label={proc.observacoes.length > 120 ? proc.observacoes.slice(0, 120) + '…' : proc.observacoes}>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                  <StickyNote className="size-3" strokeWidth={2.5} />
                  Obs.
                </span>
              </Tooltip>
            )}
          </div>
          <h3 className="truncate text-[17px] font-semibold tracking-tight text-ink transition-colors group-hover:text-blue-500">
            {title || 'Sem nome'}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[13px] text-slate-400">
            <span className="inline-flex items-center gap-1.5"><Ship className="size-3.5 text-slate-500" />{proc.armador || 'Sem armador'}</span>
            <span className="inline-flex items-center gap-1.5"><User className="size-3.5 text-slate-500" />{proc.motorista || 'Motorista N/D'}</span>
            <span className="inline-flex items-center gap-1.5"><Truck className="size-3.5 text-slate-500" />{proc.placas || 'Placas N/D'}</span>
            {agCargaTexto && (
              <span className="inline-flex items-center gap-1.5"><CalendarCheck className="size-3.5 text-slate-500" />Carreg. {agCargaTexto}</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-row gap-6 border-t border-slate-700/60 pt-3 sm:w-[44%] sm:border-t-0 sm:pt-0">
          <div className="min-w-0 flex-1">
            <div className="label mb-1">{docLabel}</div>
            <div className={`truncate text-[15px] font-semibold tabular-nums ${docValue ? 'text-slate-200' : 'text-slate-500'}`}>{docValue || 'Aguardando'}</div>
          </div>
          <div className="min-w-0 flex-1 sm:text-right">
            <div className="label mb-1">{validContainers.length > 0 ? `${validContainers.length} ${validContainers.length > 1 ? 'unidades' : 'unidade'}` : 'Contêineres'}</div>
            {validContainers.length === 0 ? (
              <div className="text-[13px] text-slate-500">Pendente</div>
            ) : (
              <div className="flex flex-wrap gap-1 sm:justify-end">
                {validContainers.slice(0, 2).map((c) => (
                  <span key={c.id} className="rounded-md bg-navy-700/70 px-1.5 py-0.5 font-mono text-[11.5px] text-slate-300">
                    {c.numero}
                  </span>
                ))}
                {validContainers.length > 2 && <span className="px-1 text-[11.5px] text-slate-500">+{validContainers.length - 2}</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy-700/80">
          <motion.div
            className={`h-full rounded-full ${done ? 'bg-emerald-500' : 'bg-blue-500'}`}
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 22 }}
          />
        </div>
        <span className={`inline-flex w-12 items-center justify-end gap-1 text-xs font-semibold tabular-nums ${done ? 'text-emerald-500' : 'text-slate-400'}`}>
          {done && <CircleCheck className="size-3.5" strokeWidth={2.5} />}
          {progress}%
        </span>
      </div>
    </div>
  )
}

// Placeholder "pulsando" enquanto o Firestore ainda não respondeu.
export function ProcessCardSkeleton() {
  return (
    <div className="card animate-pulse p-5 pl-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1 space-y-2.5">
          <div className="h-2.5 w-20 rounded bg-navy-700" />
          <div className="h-4 w-44 rounded bg-navy-700" />
          <div className="h-3 w-64 rounded bg-navy-700" />
        </div>
        <div className="space-y-2.5 sm:w-[44%]">
          <div className="h-2.5 w-16 rounded bg-navy-700" />
          <div className="h-4 w-32 rounded bg-navy-700" />
        </div>
      </div>
      <div className="mt-5 h-1.5 w-full rounded-full bg-navy-700" />
    </div>
  )
}
