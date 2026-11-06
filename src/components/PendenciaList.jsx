import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CircleAlert, GripVertical, Link2, Plus, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { agendaPendencias, blocosPorDia, diaLocal, quandoDia, reordenarDia, validarPendencia } from '../lib/pendencias'
import { criarPendencia, marcarFeita, salvarOrdem } from '../lib/pendenciasDb'
import Button from './ui/Button'
import Checkbox from './ui/Checkbox'
import EmptyState from './ui/EmptyState'
import SearchField from './ui/SearchField'
import Tooltip from './ui/Tooltip'

// Textos do arrastar pelo teclado e para leitores de tela (o padrão do dnd-kit é em inglês).
const ACESSIBILIDADE_ARRASTO = {
  screenReaderInstructions: {
    draggable: 'Para mudar a ordem, aperte espaço ou Enter, use as setas para cima e para baixo e aperte espaço ou Enter de novo para soltar. Esc cancela.',
  },
  announcements: {
    onDragStart: () => 'Pendência pega.',
    onDragOver: () => '',
    onDragEnd: ({ over }) => (over ? 'Pendência solta na nova posição.' : 'Pendência solta.'),
    onDragCancel: () => 'Mudança de ordem cancelada.',
  },
}

// Pendências de um mesmo dia: dá para arrastar e mudar a ordem (vale para a equipe toda).
function BlocoDoDia({ itens, sensors, onSoltar, ...linha }) {
  if (!onSoltar || itens.length < 2) return itens.map((item) => <Linha key={item.id} item={item} {...linha} />)
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} accessibility={ACESSIBILIDADE_ARRASTO} onDragEnd={({ active, over }) => over && onSoltar(itens, active.id, over.id)}>
      <SortableContext items={itens.map((x) => x.id)} strategy={verticalListSortingStrategy}>
        {itens.map((item) => (
          <LinhaArrastavel key={item.id} item={item} {...linha} />
        ))}
      </SortableContext>
    </DndContext>
  )
}

const GRUPOS = [
  { id: 'atrasadas', titulo: 'Atrasadas', tom: 'text-red-500' },
  { id: 'hoje', titulo: 'Hoje', tom: 'text-ink' },
  { id: 'amanha', titulo: 'Amanhã', tom: 'text-ink' },
  { id: 'proximas', titulo: 'Próximos dias', tom: 'text-ink' },
  { id: 'feitas', titulo: 'Feitas recentemente', tom: 'text-slate-400' },
]

// Campo no topo para criar pendências em sequência: texto, dia (hoje por padrão) e Enter.
function AdicaoRapida({ now }) {
  const { user } = useAuth()
  const showToast = useToast()
  const [titulo, mudarTitulo] = useState('')
  // Cópia que muda na hora (o estado só muda na próxima renderização): é ela que
  // impede o segundo Enter de gravar o mesmo texto.
  const tituloRef = useRef('')
  const setTitulo = (valor) => {
    tituloRef.current = typeof valor === 'function' ? valor(tituloRef.current) : valor
    mudarTitulo(tituloRef.current)
  }
  // null = "hoje", que acompanha a virada do dia com a aba aberta; só um dia escolhido fica fixo.
  const [diaEscolhido, setDiaEscolhido] = useState(null)
  const hoje = diaLocal(now)
  const dia = diaEscolhido ?? hoje
  const campoRef = useRef(null)

  const enviar = async (e) => {
    e.preventDefault()
    // Título vazio (ou só espaços) apenas não cria nada.
    const titulo = tituloRef.current
    const data = diaEscolhido ?? diaLocal()
    const erro = validarPendencia({ titulo, data })
    if (erro) {
      if (titulo.trim()) showToast(erro, 'error')
      return
    }
    // O campo esvazia antes de gravar: um segundo Enter já não acha texto e não
    // cria a mesma pendência de novo, e dá para ir escrevendo a próxima.
    setTitulo('')
    campoRef.current?.focus()
    try {
      await criarPendencia({ titulo, data }, user.email)
    } catch (err) {
      console.error('Erro ao criar pendência:', err)
      setTitulo((atual) => atual || titulo) // devolve o texto para tentar de novo
      showToast(err.code === 'permission-denied' ? 'Sem permissão: atualize as regras do Firestore (coleção pendencias).' : 'Não foi possível criar a pendência.', 'error')
    }
  }

  return (
    <form onSubmit={enviar} className="mb-4 flex flex-wrap items-center gap-2">
      <input
        id="pend-rapida"
        ref={campoRef}
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        maxLength={200}
        autoComplete="off"
        placeholder="Nova pendência: ex. encerrar MDF-e do motorista João"
        aria-label="Nova pendência"
        className="field min-w-[16rem] flex-1"
      />
      {/* Dia vazio ou o próprio dia de hoje voltam a "hoje". */}
      <input type="date" value={dia} onChange={(e) => setDiaEscolhido(e.target.value && e.target.value !== hoje ? e.target.value : null)} aria-label="Dia da pendência" className="field w-44" />
      <Button type="submit" icon={Plus}>Adicionar</Button>
    </form>
  )
}

// Pendência que pode ser arrastada para mudar a ordem dentro do dia.
function LinhaArrastavel(props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.item.id })
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 20 : undefined }
  return <Linha {...props} innerRef={setNodeRef} style={style} arrastando={isDragging} alca={{ ...attributes, ...listeners }} />
}

function Linha({ item, atrasada, now, onEditar, onAbrirProcesso, alca, innerRef, style, arrastando }) {
  const { user } = useAuth()
  const showToast = useToast()
  const alternar = async (feito) => {
    try {
      await marcarFeita(item.id, feito, user.email)
    } catch (err) {
      console.error('Erro ao atualizar pendência:', err)
      showToast('Não foi possível atualizar a pendência.', 'error')
    }
  }
  return (
    <div
      ref={innerRef}
      style={style}
      className={`group relative flex items-center gap-3 px-4 py-2.5 ${arrastando ? 'rounded-xl bg-navy-800 shadow-float' : ''}`}
    >
      {/* A alça fica na margem da esquerda: com ou sem ela, as linhas ficam alinhadas. */}
      {alca && (
        <Tooltip label="Arrastar para mudar a ordem">
          <button
            type="button"
            {...alca}
            aria-label={`Mudar a ordem de “${item.titulo}”`}
            className="absolute left-0 top-1/2 flex h-9 w-4 -translate-y-1/2 touch-none cursor-grab items-center justify-center rounded-md text-slate-500 opacity-40 outline-none transition-opacity hover:text-ink focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-blue-500/50 active:cursor-grabbing group-hover:opacity-100"
          >
            <GripVertical className="size-4" aria-hidden="true" />
          </button>
        </Tooltip>
      )}
      <Checkbox id={`pend-${item.id}`} tone="success" checked={!!item.feito} label={`Marcar “${item.titulo}” como feita`} onChange={alternar} />
      <button type="button" onClick={() => onEditar(item.id)} className="min-w-0 flex-1 text-left">
        <span className={`block truncate text-[14.5px] font-medium ${item.feito ? 'text-slate-500 line-through' : 'text-ink'}`}>{item.titulo}</span>
        <span className={`block text-[12.5px] ${atrasada ? 'font-medium text-red-500' : 'text-slate-500'}`}>{quandoDia(item.data, now)}</span>
      </button>
      {item.processoRotulo && (
        <button
          type="button"
          onClick={() => onAbrirProcesso(item.processoId)}
          title="Abrir o processo"
          className="flex max-w-[16rem] shrink-0 items-center gap-1.5 rounded-full bg-navy-700/70 px-2.5 py-1 text-[12.5px] text-slate-300 transition-colors hover:bg-navy-700 hover:text-ink"
        >
          <Link2 className="size-3.5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
          <span className="truncate">{item.processoRotulo}</span>
        </button>
      )}
    </div>
  )
}

// PENDÊNCIAS: tarefas do dia a dia da equipe, agrupadas por dia. Criação rápida
// no topo; clicar no título abre a edição; a caixa marca como feita.
export default function PendenciaList({ pendencias, loading, erro, onEditar, onAbrirProcesso, searchRef }) {
  const [busca, setBusca] = useState('')
  const termo = busca.toLowerCase().trim()
  // Relógio da tela: com a aba aberta na virada do dia, os grupos (Hoje, Amanhã,
  // Atrasadas) e o dia do campo rápido mudam sozinhos.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  const showToast = useToast()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  // Com a busca ligada a lista mostra só parte do dia: a ordem não muda por ela.
  const podeReordenar = !termo
  const soltar = async (itensDoDia, deId, paraId) => {
    const mudancas = reordenarDia(itensDoDia, deId, paraId)
    if (!mudancas.length) return
    try {
      await salvarOrdem(mudancas)
    } catch (err) {
      console.error('Erro ao mudar a ordem das pendências:', err)
      showToast('Não foi possível mudar a ordem. Tente de novo.', 'error')
    }
  }

  if (erro === 'permission-denied') {
    return (
      <div className="card flex gap-3 p-5 text-sm">
        <CircleAlert className="mt-0.5 size-5 shrink-0 text-yellow-500" />
        <div>
          <p className="font-semibold text-ink">As pendências ainda não estão liberadas no banco de dados.</p>
          <p className="mt-1 text-slate-400">Publique as regras atualizadas do Firestore (arquivo firestore_1.rules, trecho “pendencias”) no Console do Firebase.</p>
        </div>
      </div>
    )
  }

  const visiveis = termo ? pendencias.filter((x) => `${x.titulo} ${x.processoRotulo || ''}`.toLowerCase().includes(termo)) : pendencias
  const agenda = agendaPendencias(visiveis, now)
  const total = GRUPOS.reduce((n, g) => n + agenda[g.id].length, 0)

  return (
    <>
      <AdicaoRapida now={now} />
      <SearchField inputRef={searchRef} value={busca} onChange={setBusca} placeholder="Buscar pendência ou processo…" hint="/" className="mb-5" />

      {loading ? (
        <div className="card divide-y divide-slate-700/80 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex animate-pulse items-center gap-3 px-4 py-3.5">
              <div className="size-[21px] rounded-full bg-slate-500/15" />
              <div className="h-3.5 w-64 rounded bg-slate-500/15" />
            </div>
          ))}
        </div>
      ) : total === 0 ? (
        termo ? (
          <EmptyState search title="Nenhuma pendência encontrada" description={`Nada encontrado para “${busca}”.`} action={<Button variant="gray" size="sm" icon={X} onClick={() => setBusca('')}>Limpar busca</Button>} />
        ) : (
          <EmptyState title="Nenhuma pendência" description="Escreva acima o que precisa ser feito e escolha o dia." />
        )
      ) : (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {GRUPOS.filter((g) => agenda[g.id].length > 0).map((g) => (
            <section key={g.id}>
              <div className="mb-1.5 flex items-baseline gap-2 px-1">
                <h2 className={`font-display text-[17px] font-semibold tracking-[-0.015em] ${g.tom}`}>{g.titulo}</h2>
                <span className="text-[13px] font-medium tabular-nums text-slate-500">{agenda[g.id].length}</span>
              </div>
              <div className="card divide-y divide-slate-700/80">
                {/* As feitas vêm por hora de conclusão (não por dia) e não mudam de ordem. */}
                {(podeReordenar && g.id !== 'feitas' ? blocosPorDia(agenda[g.id]) : [{ dia: 'todas', itens: agenda[g.id] }]).map((bloco) => (
                  <BlocoDoDia
                    key={bloco.dia}
                    itens={bloco.itens}
                    sensors={sensors}
                    onSoltar={podeReordenar && g.id !== 'feitas' ? soltar : null}
                    atrasada={g.id === 'atrasadas'}
                    now={now}
                    onEditar={onEditar}
                    onAbrirProcesso={onAbrirProcesso}
                  />
                ))}
              </div>
            </section>
          ))}
        </motion.div>
      )}
    </>
  )
}
