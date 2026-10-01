import { useEffect, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { filtrarProcessos } from '../lib/processos'
import { useCardOrder } from '../hooks/useCardOrder'
import { useToast } from '../contexts/ToastContext'
import { exportarProcessosCSV } from '../lib/exportar'
import ProcessCard, { ProcessCardSkeleton } from './ProcessCard'
import ResumoBar from './ResumoBar'

function SortableCard(props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.proc.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
    opacity: isDragging ? 0.85 : undefined,
  }
  return <ProcessCard {...props} innerRef={setNodeRef} style={style} dragHandle={{ ...attributes, ...listeners }} />
}

// Busca + resumo + lista de cards da aba atual.
export default function ProcessList({ processes, loading, tab, onOpen }) {
  const [search, setSearch] = useState('')
  const { applyOrder, saveOrder } = useCardOrder()
  const showToast = useToast()

  // Os avisos de Deadline Draft dependem só do relógio: atualiza a cada
  // 30 min pra "virar de dia" sozinho com o app aberto.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Reordenar só na visão normal: sem busca e fora do arquivo.
  const sortable = !search.trim() && tab !== 'archive'
  const filtered = filtrarProcessos(processes, tab, search)
  const visible = sortable ? applyOrder(filtered) : filtered

  const exportarCSV = () => {
    if (!filtered.length) {
      showToast('Não há processos nesta lista para exportar.', 'error')
      return
    }
    exportarProcessosCSV(filtered, tab)
    showToast(`${filtered.length} processo(s) exportado(s).`)
  }

  const handleDragEnd =({ active, over }) => {
    if (!over || active.id === over.id) return
    const ids = visible.map((p) => p.id)
    saveOrder(arrayMove(ids, ids.indexOf(active.id), ids.indexOf(over.id)))
  }

  return (
    <>
      <ResumoBar processes={processes} tab={tab} now={now} />

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <i className="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por armador, motorista, placa, documento/booking ou nº do contêiner..."
            className="w-full pl-9 pr-9 py-2.5 text-sm border border-slate-600 rounded-lg bg-navy-800 text-ink focus:border-blue-500 outline-none transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              title="Limpar busca"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-ink w-5 h-5 flex items-center justify-center rounded-full hover:bg-navy-700 transition"
            >
              <i className="fas fa-xmark text-xs" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={exportarCSV}
          title="Exportar esta lista (aba + busca atuais) para Excel/CSV"
          className="shrink-0 px-3.5 py-2.5 text-sm font-semibold text-slate-300 hover:text-ink bg-navy-800 hover:bg-navy-700 border border-slate-700 rounded-lg transition flex items-center gap-2"
        >
          <i className="fas fa-file-export" />
          <span className="hidden sm:inline">Exportar</span>
        </button>
      </div>

      <div className="space-y-3.5">
        {loading ? (
          <>
            <ProcessCardSkeleton />
            <ProcessCardSkeleton />
            <ProcessCardSkeleton />
          </>
        ) : visible.length === 0 ? (
          <div className="text-center py-16 px-6 text-slate-500 bg-navy-800/60 rounded-2xl border border-dashed border-slate-700">
            <i className="fas fa-inbox text-2xl text-slate-500 mb-3" />
            <p className="text-sm">
              {search.trim() ? `Nenhum processo encontrado para "${search}".` : 'Nenhum processo encontrado nesta visão.'}
            </p>
          </div>
        ) : sortable && visible.length > 1 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={visible.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              {visible.map((proc) => (
                <SortableCard key={proc.id} proc={proc} now={now} onOpen={onOpen} />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          visible.map((proc) => <ProcessCard key={proc.id} proc={proc} now={now} onOpen={onOpen} />)
        )}
      </div>
    </>
  )
}
