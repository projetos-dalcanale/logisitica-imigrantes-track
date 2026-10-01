import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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
import { Download, Plus, Search, X } from 'lucide-react'
import { filtrarProcessos } from '../lib/processos'
import { useCardOrder } from '../hooks/useCardOrder'
import { useToast } from '../contexts/ToastContext'
import { exportarProcessosCSV } from '../lib/exportar'
import ProcessCard, { ProcessCardSkeleton } from './ProcessCard'
import ResumoBar from './ResumoBar'
import EmptyState from './ui/EmptyState'
import Button from './ui/Button'
import Tooltip from './ui/Tooltip'

function SortableCard(props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.proc.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
    position: 'relative',
  }
  return <ProcessCard {...props} innerRef={setNodeRef} style={style} dragging={isDragging} dragHandle={{ ...attributes, ...listeners }} />
}

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15 } },
}

const EMPTY_TEXT = {
  import: ['Nenhuma importação em andamento', 'Crie um processo de importação para começar a acompanhar o checklist.'],
  export: ['Nenhuma exportação em andamento', 'Crie um processo de exportação para acompanhar prazos de Draft e carga.'],
  archive: ['Nada arquivado ainda', 'Processos concluídos aparecem aqui depois de arquivados.'],
}

// Busca + resumo + lista de cards da aba atual.
export default function ProcessList({ processes, loading, tab, onOpen, searchRef, onNew }) {
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
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
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

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const ids = visible.map((p) => p.id)
    saveOrder(arrayMove(ids, ids.indexOf(active.id), ids.indexOf(over.id)))
  }

  let content
  if (loading) {
    content = [0, 1, 2].map((i) => <ProcessCardSkeleton key={i} />)
  } else if (visible.length === 0) {
    content = search.trim() ? (
      <EmptyState search title="Nenhum resultado" description={`Nada encontrado para “${search}” nesta aba.`} action={<Button variant="secondary" size="sm" icon={X} onClick={() => setSearch('')}>Limpar busca</Button>} />
    ) : (
      <EmptyState
        title={EMPTY_TEXT[tab][0]}
        description={EMPTY_TEXT[tab][1]}
        action={tab !== 'archive' && <Button size="sm" icon={Plus} onClick={onNew}>Novo processo</Button>}
      />
    )
  } else if (sortable && visible.length > 1) {
    content = (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visible.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          {visible.map((proc, i) => (
            <motion.div key={proc.id} {...fadeIn} transition={{ delay: Math.min(i * 0.03, 0.3) }}>
              <SortableCard proc={proc} now={now} onOpen={onOpen} />
            </motion.div>
          ))}
        </SortableContext>
      </DndContext>
    )
  } else {
    content = (
      <AnimatePresence mode="popLayout" initial={false}>
        {visible.map((proc) => (
          <motion.div key={proc.id} layout {...fadeIn}>
            <ProcessCard proc={proc} now={now} onOpen={onOpen} />
          </motion.div>
        ))}
      </AnimatePresence>
    )
  }

  return (
    <>
      <ResumoBar processes={processes} tab={tab} now={now} />

      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && (setSearch(''), e.currentTarget.blur())}
            placeholder="Filtrar processos…"
            title="Filtra por nome, armador, motorista, placa, documento/booking ou contêiner"
            className="field h-11 pl-10 pr-10 bg-navy-800 border-slate-700/80 shadow-soft"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Limpar busca"
              className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-navy-700 hover:text-ink"
            >
              <X className="size-4" />
            </button>
          ) : (
            <span className="kbd pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 sm:inline-flex">/</span>
          )}
        </div>
        <Tooltip label="Exportar esta lista para Excel (CSV)">
          <Button variant="secondary" icon={Download} onClick={exportarCSV} className="h-11 shadow-soft">
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        </Tooltip>
      </div>

      <div className="space-y-3">{content}</div>
    </>
  )
}
