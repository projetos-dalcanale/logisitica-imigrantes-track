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
import { Download, Plus, X } from 'lucide-react'
import { filtrarProcessos } from '../lib/processos'
import { agruparPorUrgencia } from '../lib/etapas'
import { useCardOrder } from '../hooks/useCardOrder'
import { useToast } from '../contexts/ToastContext'
import { exportarProcessosCSV } from '../lib/exportar'
import ProcessCard, { ProcessCardSkeleton } from './ProcessCard'
import ResumoBar from './ResumoBar'
import EmptyState from './ui/EmptyState'
import Button from './ui/Button'
import Tooltip from './ui/Tooltip'
import SearchField from './ui/SearchField'

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

const TOM_TITULO = {
  danger: 'text-red-500',
  warn: 'text-yellow-500',
  brand: 'text-blue-500',
  neutral: 'text-ink',
  success: 'text-emerald-500',
}

// Cabeçalho de grupo no estilo do app Lembretes: título colorido e contagem.
function GrupoTitulo({ grupo }) {
  return (
    <div className="mb-2 flex items-baseline gap-2 px-1">
      <h2 className={`font-display text-[17px] font-semibold tracking-[-0.015em] ${TOM_TITULO[grupo.tom]}`}>{grupo.label}</h2>
      <span className="text-[13px] font-medium tabular-nums text-slate-500">{grupo.itens.length}</span>
    </div>
  )
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

  // Cada grupo tem o seu DndContext, então os dois cards são do mesmo grupo.
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
  } else {
    // Fora do arquivo, a lista é separada por urgência (atrasados, hoje...).
    // A ordem arrastada vale dentro de cada grupo.
    const grupos = tab === 'archive' ? [{ id: 'todos', itens: visible }] : agruparPorUrgencia(visible, now)
    content = grupos.map((grupo) => {
      let cards
      if (sortable && grupo.itens.length > 1) {
        cards = (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={grupo.itens.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              {grupo.itens.map((proc, i) => (
                <motion.div key={proc.id} {...fadeIn} transition={{ delay: Math.min(i * 0.03, 0.3) }}>
                  <SortableCard proc={proc} now={now} onOpen={onOpen} />
                </motion.div>
              ))}
            </SortableContext>
          </DndContext>
        )
      } else {
        cards = (
          <AnimatePresence mode="popLayout" initial={false}>
            {grupo.itens.map((proc) => (
              <motion.div key={proc.id} layout {...fadeIn}>
                <ProcessCard proc={proc} now={now} onOpen={onOpen} />
              </motion.div>
            ))}
          </AnimatePresence>
        )
      }
      return (
        <section key={grupo.id}>
          {grupo.label && <GrupoTitulo grupo={grupo} />}
          <div className="space-y-2.5">{cards}</div>
        </section>
      )
    })
  }

  return (
    <>
      <ResumoBar processes={processes} tab={tab} now={now} />

      <div className="mb-4 flex items-center gap-2">
        <SearchField
          inputRef={searchRef}
          value={search}
          onChange={setSearch}
          placeholder="Filtrar processos"
          hint="/"
          title="Filtra por nome, armador, motorista, placa, documento/booking ou contêiner"
          className="flex-1"
        />
        <Tooltip label="Exportar esta lista para Excel (CSV)">
          <Button variant="gray" icon={Download} onClick={exportarCSV} aria-label="Exportar para Excel">
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        </Tooltip>
      </div>

      <div className={loading || !visible.length ? 'space-y-2.5' : 'space-y-7'}>{content}</div>
    </>
  )
}
