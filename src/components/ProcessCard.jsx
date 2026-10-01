import {
  draftAlertConfig,
  formatarDataHoraCurta,
  getDraftDeadlineInfo,
  getProcessProgress,
} from '../lib/processos'

// Cartão de um processo na tela principal. `dragHandle` (opcional) recebe as
// props do dnd-kit para o ícone de arrastar; sem ele o card não é reordenável.
export default function ProcessCard({ proc, now, onOpen, dragHandle, style, innerRef }) {
  const containers = proc.containers || []
  const title = proc.type === 'import' ? proc.importador : proc.exportador
  const docRef =
    proc.type === 'import'
      ? proc.documentoTipo ? `${proc.documentoTipo}: ${proc.documentoNumero || ''}` : proc.documento
      : proc.booking

  const validContainers = containers.filter((c) => c.numero !== '')
  const draftInfo = getDraftDeadlineInfo(proc, now)

  // Agendamento de Carregamento mais próximo (só importação)
  const agCarga =
    proc.type === 'import'
      ? containers.map((c) => c.checklist?.ag_carga).filter(Boolean).sort()[0]
      : null
  const agCargaTexto = formatarDataHoraCurta(agCarga)

  const progress = getProcessProgress(proc)
  const progressDone = progress === 100

  // Faixa colorida na borda esquerda pra escanear o status de relance.
  let statusBorder = 'border-l-blue-500'
  if (proc.status === 'archived') statusBorder = 'border-l-slate-600'
  else if (draftInfo) statusBorder = draftAlertConfig[draftInfo.nivel].border
  else if (progressDone) statusBorder = 'border-l-emerald-500'

  return (
    <div
      ref={innerRef}
      style={style}
      onClick={() => onOpen(proc.id)}
      className={`relative bg-navy-800 p-5 rounded-2xl shadow-lg border border-slate-700 border-l-4 ${statusBorder} cursor-pointer hover:border-t-blue-500/70 hover:border-r-blue-500/70 hover:border-b-blue-500/70 hover:shadow-xl hover:shadow-blue-900/20 hover:-translate-y-0.5 transition-all group`}
    >
      {dragHandle && (
        <div
          {...dragHandle}
          onClick={(e) => e.stopPropagation()}
          title="Arrastar para reordenar"
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-300 hover:bg-navy-900/60 cursor-grab active:cursor-grabbing transition-colors z-10 touch-none"
        >
          <i className="fas fa-grip-vertical text-xs" />
        </div>
      )}
      <div className={`flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 w-full ${dragHandle ? 'sm:pr-8' : ''}`}>
        <div className="sm:w-1/3 min-w-0">
          <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">
            {proc.type === 'import' ? 'Importação' : 'Exportação'}
          </div>
          <div className="font-bold text-ink text-lg truncate group-hover:text-blue-400 transition-colors">{title || 'Sem Nome'}</div>
          <div className="text-xs text-slate-400 mt-1.5">
            <i className="fas fa-ship mr-1.5 opacity-50 w-3 inline-block" />{proc.armador || 'N/A'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <i className="fas fa-id-badge mr-1.5 opacity-50 w-3 inline-block" />{proc.motorista || 'Motorista N/D'}
            <span className="mx-1 opacity-40">•</span>
            <i className="fas fa-truck mr-1.5 opacity-50 w-3 inline-block" />{proc.placas || 'Placas N/D'}
          </div>
          {agCargaTexto && (
            <div className="text-xs text-slate-500 mt-1">
              <i className="fas fa-calendar-check mr-1.5 opacity-50 w-3 inline-block" />Carreg.: {agCargaTexto}
            </div>
          )}
          {draftInfo && (
            <div className={`inline-flex items-center gap-1.5 mt-2 px-2 py-1 rounded-md text-[10px] font-bold ${draftAlertConfig[draftInfo.nivel].badge}`}>
              <i className={`fas ${draftAlertConfig[draftInfo.nivel].icon}`} />{draftInfo.texto}
            </div>
          )}
          {proc.observacoes?.trim() && (
            <div title={proc.observacoes} className="inline-flex items-center gap-1.5 mt-2 ml-1 px-2 py-1 rounded-md text-[10px] font-bold bg-slate-500/10 text-slate-500 border border-slate-600/40">
              <i className="fas fa-note-sticky" />Observação
            </div>
          )}
        </div>
        <div className="sm:w-1/3 min-w-0 border-t sm:border-t-0 sm:border-l border-slate-700 pt-3 sm:pt-0 sm:pl-6">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Doc / Booking</div>
          <div className="font-bold text-slate-200 text-base">{docRef || 'Aguardando'}</div>
        </div>
        <div className="sm:w-1/3 flex flex-col items-start sm:items-end">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">
            {validContainers.length > 0 ? `${validContainers.length} Unid.` : 'Pendente'}
          </div>
          <div className="flex flex-wrap gap-1.5 sm:justify-end">
            {validContainers.slice(0, 3).map((c) => (
              <span key={c.id} className="bg-navy-900 border border-slate-700 text-slate-300 text-xs px-2 py-1 rounded-md shadow-sm">
                {c.numero}
                {c.tipo && <span className="text-slate-500"> · {c.tipo}</span>}
              </span>
            ))}
            {validContainers.length > 3 && (
              <span className="text-xs text-slate-500 px-1">+{validContainers.length - 3}</span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-700/60">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Progresso</span>
          <span className={`text-[10px] font-bold flex items-center gap-1 ${progressDone ? 'text-emerald-400' : 'text-slate-400'}`}>
            {progressDone && <i className="fas fa-circle-check" />}
            {progress}%
          </span>
        </div>
        <div className="w-full h-2 bg-navy-900/80 rounded-full overflow-hidden">
          <div
            className={`h-full ${progressDone ? 'bg-emerald-500' : 'bg-blue-500'} rounded-full transition-all duration-300`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// Placeholder "pulsando" enquanto o Firestore ainda não respondeu.
export function ProcessCardSkeleton() {
  return (
    <div className="bg-navy-800 p-5 rounded-2xl shadow-lg border border-slate-700 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 w-full">
        <div className="sm:w-1/3 min-w-0 space-y-2.5">
          <div className="h-2.5 w-16 bg-navy-700 rounded" />
          <div className="h-4 w-32 bg-navy-700 rounded" />
          <div className="h-2.5 w-24 bg-navy-700 rounded" />
        </div>
        <div className="sm:w-1/3 min-w-0 space-y-2.5 border-t sm:border-t-0 sm:border-l border-slate-700 pt-3 sm:pt-0 sm:pl-6">
          <div className="h-2.5 w-20 bg-navy-700 rounded" />
          <div className="h-4 w-28 bg-navy-700 rounded" />
        </div>
        <div className="sm:w-1/3 flex flex-col items-start sm:items-end space-y-2.5">
          <div className="h-2.5 w-16 bg-navy-700 rounded" />
          <div className="h-5 w-24 bg-navy-700 rounded" />
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-700/60">
        <div className="h-1.5 w-full bg-navy-700 rounded-full" />
      </div>
    </div>
  )
}
