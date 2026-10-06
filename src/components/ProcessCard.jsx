import { motion } from 'motion/react'
import { ArrowRight, CalendarCheck, Check, CircleCheck, Clock, GripVertical, Package, StickyNote, TriangleAlert, Truck, User } from 'lucide-react'
import {
  draftAlertConfig,
  ehCargaSolta,
  identificacaoUnidade,
  formatarDataHoraCurta,
  getDraftDeadlineInfo,
  distintos,
  formatarPlacas,
  transportePorContainer,
} from '../lib/processos'
import { etapasProcesso, processoConcluido, proximaAcao } from '../lib/etapas'
import Tooltip from './ui/Tooltip'

// Ícone do aviso de Deadline Draft conforme o nível (relógio ou alerta).
export function DraftIcon({ nivel, className }) {
  const Icon = draftAlertConfig[nivel].icon === 'alert' ? TriangleAlert : Clock
  return <Icon className={className} strokeWidth={2.4} />
}

// Cores da próxima ação e dos trechos da barra de etapas.
const TOM_TEXTO = {
  neutral: 'text-slate-400',
  brand: 'text-ink',
  warn: 'text-yellow-500',
  danger: 'text-red-500',
  success: 'text-emerald-500',
}
const TOM_ICONE = { neutral: ArrowRight, brand: CalendarCheck, warn: Clock, danger: TriangleAlert, success: CircleCheck }

// Barra dividida por etapa: cada trecho enche conforme os contêineres que
// já cumpriram aquela etapa. Passando o mouse, mostra a lista de etapas.
function EtapasBar({ etapas, done }) {
  const lista = (
    <ul className="space-y-0.5">
      {etapas.map((e) => (
        <li key={e.id} className="flex items-center gap-1.5">
          <Check className={`size-3 ${e.total && e.feitos === e.total ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
          {e.label}
          {e.total > 1 && <span className="opacity-60">{e.feitos}/{e.total}</span>}
        </li>
      ))}
    </ul>
  )
  return (
    <Tooltip label={lista}>
      <div className="flex flex-1 gap-1 py-1">
        {etapas.map((e) => (
          <div key={e.id} className="h-1 flex-1 overflow-hidden rounded-full bg-slate-500/15">
            <motion.div
              className={`h-full rounded-full ${done ? 'bg-emerald-500' : 'bg-blue-500'}`}
              initial={false}
              animate={{ width: `${e.total ? (e.feitos / e.total) * 100 : 0}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 22 }}
            />
          </div>
        ))}
      </div>
    </Tooltip>
  )
}

function Meta({ icon: Icon, children, muted }) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 ${muted ? 'text-slate-500' : 'text-slate-400'}`}>
      <Icon className="size-3.5 shrink-0 opacity-80" strokeWidth={2} />
      <span className="truncate">{children}</span>
    </span>
  )
}

// Cartão de um processo. `dragHandle` (opcional) recebe as props do dnd-kit
// para o ícone de arrastar; sem ele o card não é reordenável.
export default function ProcessCard({ proc, now, onOpen, dragHandle, style, innerRef, dragging }) {
  const containers = proc.containers || []
  const isImport = proc.type === 'import'
  const title = isImport ? proc.importador : proc.exportador
  const doc = isImport ? (proc.documentoTipo ? `${proc.documentoTipo} ${proc.documentoNumero || ''}` : proc.documento) : proc.booking && `Booking ${proc.booking}`
  const numeros = containers.map((c) => c.numero).filter(Boolean)
  const draftInfo = getDraftDeadlineInfo(proc, now)
  const agCarga = isImport ? containers.map((c) => c.checklist?.ag_carga).filter(Boolean).sort()[0] : null
  const agCargaTexto = formatarDataHoraCurta(agCarga)
  const done = processoConcluido(proc)
  const etapas = etapasProcesso(proc)
  const etapasFeitas = etapas.filter((e) => e.total && e.feitos === e.total).length
  const acao = proximaAcao(proc, now)
  const AcaoIcon = TOM_ICONE[acao.tom]
  // Motoristas e placas de todos os contêineres (cada um pode ter o seu).
  const transporte = transportePorContainer(proc)
  const motoristas = distintos(transporte.map((t) => t.motorista))
  const placas = distintos(transporte.map((t) => formatarPlacas(t.placas)))
  const resumo = (lista, vazio, plural) => (lista.length === 0 ? vazio : lista.length <= 2 ? lista.join(' · ') : `${lista.length} ${plural}`)
  const detalheTransporte =
    transporte.length > 1
      ? transporte.map((t, i) => `${t.numero || `Contêiner ${i + 1}`}: ${t.motorista || 'sem motorista'}${t.placas ? ` (${formatarPlacas(t.placas)})` : ''}`).join('\n')
      : null

  let status
  if (draftInfo) {
    status = (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold ${draftAlertConfig[draftInfo.nivel].badge}`}>
        <DraftIcon nivel={draftInfo.nivel} className="size-3" />
        {draftInfo.texto}
      </span>
    )
  } else if (done && proc.status !== 'archived') {
    status = (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[12px] font-semibold text-emerald-500">
        <CircleCheck className="size-3" strokeWidth={2.6} /> Pronto
      </span>
    )
  }

  return (
    <div
      ref={innerRef}
      style={style}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(proc.id)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen(proc.id))}
      className={`card group relative cursor-pointer px-5 py-4 outline-none transition-[box-shadow,transform] duration-200 hover:shadow-lift focus-visible:shadow-[0_0_0_3px_rgb(var(--blue-500)/0.35)] active:scale-[0.995] ${dragging ? 'shadow-float' : ''}`}
    >
      {dragHandle && (
        <Tooltip label="Arrastar para reordenar">
          <div
            {...dragHandle}
            onClick={(e) => e.stopPropagation()}
            className="absolute -left-0.5 top-1/2 z-10 flex h-10 w-5 -translate-y-1/2 touch-none cursor-grab items-center justify-center rounded-md text-slate-500 opacity-0 transition-opacity hover:text-ink active:cursor-grabbing group-hover:opacity-100 max-sm:opacity-60"
          >
            <GripVertical className="size-4" />
          </div>
        </Tooltip>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[16px] font-semibold tracking-[-0.015em] text-ink">{title || 'Sem nome'}</h3>
            {proc.observacoes?.trim() && (
              <Tooltip label={proc.observacoes.length > 120 ? proc.observacoes.slice(0, 120) + '…' : proc.observacoes}>
                <StickyNote className="size-3.5 shrink-0 text-yellow-500" strokeWidth={2.2} />
              </Tooltip>
            )}
          </div>
          <p className="mt-0.5 truncate text-[13.5px] text-slate-400">
            {[proc.armador || 'Sem armador', doc].filter(Boolean).join('  ·  ')}
          </p>
        </div>
        <div className="shrink-0 pt-0.5">{status}</div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
        <Tooltip label={detalheTransporte && <span className="whitespace-pre-line">{detalheTransporte}</span>}>
          <span className="inline-flex min-w-0 items-center gap-x-4">
            <Meta icon={User} muted={!motoristas.length}>{resumo(motoristas, 'Sem motorista', 'motoristas')}</Meta>
            <Meta icon={Truck} muted={!placas.length}>{resumo(placas, 'Sem placas', 'placas')}</Meta>
          </span>
        </Tooltip>
        {agCargaTexto && <Meta icon={CalendarCheck}>Carreg. {agCargaTexto}</Meta>}
        {ehCargaSolta(proc) ? (
          <span className="ml-auto inline-flex min-w-0 items-center gap-1.5 text-slate-400">
            <Package className="size-3.5 shrink-0 opacity-80" strokeWidth={2} />
            <span className="truncate">{identificacaoUnidade(proc)}</span>
          </span>
        ) : numeros.length > 0 ? (
          <span className="ml-auto font-mono text-[12px] text-slate-400">
            {numeros.slice(0, 2).join('  ')}
            {numeros.length > 2 && <span className="text-slate-500"> +{numeros.length - 2}</span>}
          </span>
        ) : (
          <span className="ml-auto text-slate-500">Sem contêiner</span>
        )}
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-3 text-[12.5px]">
        <span className={`inline-flex min-w-0 items-center gap-1.5 font-medium ${TOM_TEXTO[acao.tom]}`}>
          <AcaoIcon className="size-3.5 shrink-0" strokeWidth={2.4} />
          <span className="truncate">{acao.texto}</span>
        </span>
        <span className="shrink-0 text-[11.5px] font-medium tabular-nums text-slate-500">
          <span className="sm:hidden">{etapasFeitas}/{etapas.length}</span>
          <span className="max-sm:hidden">{etapasFeitas} de {etapas.length} etapas</span>
        </span>
      </div>
      <div className="mt-1.5 flex">
        <EtapasBar etapas={etapas} done={done} />
      </div>
    </div>
  )
}

// Placeholder "pulsando" enquanto o Firestore ainda não respondeu.
export function ProcessCardSkeleton() {
  return (
    <div className="card animate-pulse px-5 py-4">
      <div className="h-4 w-48 rounded-md bg-slate-500/15" />
      <div className="mt-2 h-3 w-64 rounded-md bg-slate-500/10" />
      <div className="mt-4 h-3 w-40 rounded-md bg-slate-500/10" />
      <div className="mt-4 h-3 w-56 rounded-md bg-slate-500/10" />
      <div className="mt-2.5 h-1 w-full rounded-full bg-slate-500/10" />
    </div>
  )
}
