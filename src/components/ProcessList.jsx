import { useEffect, useMemo, useState } from 'react'
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
import { LayoutGrid, Plus, Table2, X } from 'lucide-react'
import { filtrarProcessos } from '../lib/processos'
import { agruparPorUrgencia } from '../lib/etapas'
import { useCardOrder } from '../hooks/useCardOrder'
import { useToast } from '../contexts/ToastContext'
import { copiarProcessos, exportarProcessosCSV, exportarProcessosXlsx } from '../lib/exportar'
import ProcessCard, { ProcessCardSkeleton } from './ProcessCard'
import ProcessTable from './ProcessTable'
import ResumoBar from './ResumoBar'
import EmptyState from './ui/EmptyState'
import Button from './ui/Button'
import ExportarMenu from './ExportarMenu'
import SearchField from './ui/SearchField'
import Segmented from './ui/Segmented'

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
export default function ProcessList({ processes, loading, tab, onOpen, searchRef, onNew, selecionadoId, tabela, modo, onModo }) {
  const [search, setSearch] = useState('')
  const { applyOrder, saveOrder } = useCardOrder()
  const showToast = useToast()
  // Seleção do modo tabela: vale só para a aba e a busca em que foi feita.
  const [selecao, setSelecao] = useState({ chave: '', ids: new Set() })

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

  const chaveSelecao = `${tab}|${search}`
  const marcados = selecao.chave === chaveSelecao ? selecao.ids : null
  const selecionados = useMemo(() => new Set(filtered.filter((p) => marcados?.has(p.id)).map((p) => p.id)), [filtered, marcados])
  const limparSelecao = () => setSelecao({ chave: chaveSelecao, ids: new Set() })
  const alternarSelecao = (id) => {
    const ids = new Set(selecionados)
    if (!ids.delete(id)) ids.add(id)
    setSelecao({ chave: chaveSelecao, ids })
  }
  const selecionarTodos = (todos, ids) => setSelecao({ chave: chaveSelecao, ids: new Set(todos ? ids : []) })

  // Exporta as linhas selecionadas (modo tabela) ou, sem seleção, a lista toda.
  const paraExportar = tabela && selecionados.size > 0 ? filtered.filter((p) => selecionados.has(p.id)) : filtered
  const exportar = async (tipo) => {
    if (!paraExportar.length) {
      showToast('Não há processos nesta lista para exportar.', 'error')
      return
    }
    try {
      if (tipo === 'xlsx') await exportarProcessosXlsx(paraExportar, tab)
      else if (tipo === 'csv') exportarProcessosCSV(paraExportar, tab)
      else await copiarProcessos(paraExportar)
      showToast(tipo === 'copiar' ? `${paraExportar.length} processo(s) copiado(s): é só colar no e-mail.` : `${paraExportar.length} processo(s) exportado(s).`)
    } catch (erro) {
      console.error('Erro ao exportar:', erro)
      showToast('Não foi possível exportar. Tente de novo.', 'error')
    }
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
  } else if (tabela) {
    content = (
      <ProcessTable
        processes={visible}
        now={now}
        onOpen={onOpen}
        selecionadoId={selecionadoId}
        selecionados={selecionados}
        onAlternarSelecao={alternarSelecao}
        onSelecionarTodos={selecionarTodos}
        semGrupos={tab === 'archive'}
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
                  <SortableCard proc={proc} now={now} onOpen={onOpen} selecionado={proc.id === selecionadoId} />
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
                <ProcessCard proc={proc} now={now} onOpen={onOpen} selecionado={proc.id === selecionadoId} />
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
          placeholder="Filtrar processos…"
          hint="/"
          title="Filtra por nome, armador, motorista, placa, documento/booking ou contêiner"
          className="flex-1"
        />
        <Segmented
          size="md"
          className="hidden w-52 shrink-0 lg:flex"
          value={modo}
          onChange={onModo}
          options={[
            { value: 'cartoes', label: 'Cartões', icon: LayoutGrid },
            { value: 'tabela', label: 'Tabela', icon: Table2 },
          ]}
        />
        <ExportarMenu
          total={filtered.length}
          selecionados={tabela ? selecionados.size : 0}
          onExcel={() => exportar('xlsx')}
          onCsv={() => exportar('csv')}
          onCopiar={() => exportar('copiar')}
        />
      </div>

      {tabela && selecionados.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-blue-500/8 px-4 py-2 text-[13.5px]" role="status">
          <span className="font-medium text-ink">{selecionados.size} {selecionados.size === 1 ? 'selecionado' : 'selecionados'}</span>
          <button type="button" className="text-blue-500 hover:text-blue-400" onClick={limparSelecao}>Limpar seleção</button>
        </div>
      )}

      <div className={loading || !visible.length ? 'space-y-2.5' : tabela ? '' : 'space-y-7'}>{content}</div>
    </>
  )
}
