import { useRef, useState } from 'react'
import { motion } from 'motion/react'
import { CircleAlert, Link2, Plus, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { agendaPendencias, diaLocal, quandoDia, validarPendencia } from '../lib/pendencias'
import { criarPendencia, marcarFeita } from '../lib/pendenciasDb'
import Button from './ui/Button'
import Checkbox from './ui/Checkbox'
import EmptyState from './ui/EmptyState'
import SearchField from './ui/SearchField'

const GRUPOS = [
  { id: 'atrasadas', titulo: 'Atrasadas', tom: 'text-red-500' },
  { id: 'hoje', titulo: 'Hoje', tom: 'text-ink' },
  { id: 'amanha', titulo: 'Amanhã', tom: 'text-ink' },
  { id: 'proximas', titulo: 'Próximos dias', tom: 'text-ink' },
  { id: 'feitas', titulo: 'Feitas recentemente', tom: 'text-slate-400' },
]

// Campo no topo para criar pendências em sequência: texto, dia (hoje por padrão) e Enter.
function AdicaoRapida() {
  const { user } = useAuth()
  const showToast = useToast()
  const [titulo, setTitulo] = useState('')
  const [dia, setDia] = useState(() => diaLocal())
  const campoRef = useRef(null)

  const enviar = async (e) => {
    e.preventDefault()
    // Dia vazio usa hoje; título vazio (ou só espaços) apenas não cria nada.
    const data = dia || diaLocal()
    const erro = validarPendencia({ titulo, data })
    if (erro) {
      if (titulo.trim()) showToast(erro, 'error')
      return
    }
    try {
      await criarPendencia({ titulo, data }, user.email)
      setTitulo('')
      campoRef.current?.focus()
    } catch (err) {
      console.error('Erro ao criar pendência:', err)
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
      <input type="date" value={dia} onChange={(e) => setDia(e.target.value)} aria-label="Dia da pendência" className="field w-44" />
      <Button type="submit" icon={Plus}>Adicionar</Button>
    </form>
  )
}

function Linha({ item, atrasada, onEditar, onAbrirProcesso }) {
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
    <div className="flex items-center gap-3 px-4 py-2.5">
      <Checkbox id={`pend-${item.id}`} tone="success" checked={!!item.feito} label={`Marcar “${item.titulo}” como feita`} onChange={alternar} />
      <button type="button" onClick={() => onEditar(item.id)} className="min-w-0 flex-1 text-left">
        <span className={`block truncate text-[14.5px] font-medium ${item.feito ? 'text-slate-500 line-through' : 'text-ink'}`}>{item.titulo}</span>
        <span className={`block text-[12.5px] ${atrasada ? 'font-medium text-red-500' : 'text-slate-500'}`}>{quandoDia(item.data)}</span>
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
  const agenda = agendaPendencias(visiveis)
  const total = GRUPOS.reduce((n, g) => n + agenda[g.id].length, 0)

  return (
    <>
      <AdicaoRapida />
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
              <div className="card divide-y divide-slate-700/80 overflow-hidden">
                {agenda[g.id].map((item) => (
                  <Linha key={item.id} item={item} atrasada={g.id === 'atrasadas'} onEditar={onEditar} onAbrirProcesso={onAbrirProcesso} />
                ))}
              </div>
            </section>
          ))}
        </motion.div>
      )}
    </>
  )
}
