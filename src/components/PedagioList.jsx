import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowLeftRight, ArrowRight, ChevronRight, CircleAlert, Plus, X } from 'lucide-react'
import { formatarNumero } from '../lib/numeros'
import EmptyState from './ui/EmptyState'
import Button from './ui/Button'
import SearchField from './ui/SearchField'
import Segmented from './ui/Segmented'

const FILTROS = [
  { value: 'todas', label: 'Todas' },
  { value: 'ida', label: 'Somente ida' },
  { value: 'idaVolta', label: 'Ida e volta' },
]

function PedagioRow({ rota, onOpen }) {
  const Seta = rota.idaVolta ? ArrowLeftRight : ArrowRight
  return (
    <button
      type="button"
      onClick={() => onOpen(rota.id)}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-navy-700/40 active:bg-navy-700/70"
    >
      <div className="min-w-0 flex-1">
        {rota.nome && <div className="truncate text-[15px] font-semibold text-ink">{rota.nome}</div>}
        <div className={`flex items-center gap-2 ${rota.nome ? 'text-[13px] text-slate-400' : 'text-[15px] font-medium text-ink'}`}>
          <span className="truncate">{rota.origem}</span>
          <Seta className="size-4 shrink-0 text-slate-500" strokeWidth={2.2} />
          <span className="truncate">{rota.destino}</span>
        </div>
        <div className="truncate text-[13px] text-slate-400">
          {[rota.idaVolta ? 'Ida e volta' : 'Somente ida', rota.pontos?.length > 0 && `${rota.pontos.length} ${rota.pontos.length === 1 ? 'parada' : 'paradas'}`,`${rota.eixos || 0} ${rota.eixos === 1 ? 'eixo' : 'eixos'}`, `${formatarNumero(rota.kmPrevisto, 1)} km`].filter(Boolean).join(' · ')}
        </div>
      </div>
      <div className="text-right">
        <div className="text-[11px] text-slate-500">Pedágio</div>
        <div className="text-[14px] font-medium tabular-nums text-ink">R$ {formatarNumero(rota.valorTotal)}</div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-slate-500/70" strokeWidth={2.4} />
    </button>
  )
}

// ROTAS E VALORES DE PEDÁGIO: lista com busca por origem e destino.
export default function PedagioList({ pedagios, loading, erro, onOpen, onNew, searchRef }) {
  const [busca, setBusca] = useState('')
  const termo = busca.toLowerCase().trim()
  const [trajeto, setTrajeto] = useState('todas') // 'todas' | 'ida' | 'idaVolta'
  const filtrando = Boolean(termo) || trajeto !== 'todas'
  const visiveis = pedagios.filter(
    (p) =>
      (trajeto === 'todas' || Boolean(p.idaVolta) === (trajeto === 'idaVolta')) &&
      (!termo || [p.nome, p.origem, ...(p.pontos || []), p.destino].join(' ').toLowerCase().includes(termo))
  )
  const limpar = () => (setBusca(''), setTrajeto('todas'))

  if (erro === 'permission-denied') {
    return (
      <div className="card flex gap-3 p-5 text-sm">
        <CircleAlert className="mt-0.5 size-5 shrink-0 text-yellow-500" />
        <div>
          <p className="font-semibold text-ink">As rotas de pedágio ainda não estão liberadas no banco de dados.</p>
          <p className="mt-1 text-slate-400">Publique as regras atualizadas do Firestore (arquivo firestore_1.rules, trecho “pedagios”) no Console do Firebase.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <SearchField inputRef={searchRef} value={busca} onChange={setBusca} placeholder="Buscar rota, origem ou destino" hint="/" className="mb-3" />
      <Segmented className="mb-5 max-w-md" options={FILTROS} value={trajeto} onChange={setTrajeto} />

      {loading ? (
        <div className="card divide-y divide-slate-700/80 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex animate-pulse items-center gap-3 px-4 py-3">
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-52 rounded bg-slate-500/15" />
                <div className="h-3 w-40 rounded bg-slate-500/10" />
              </div>
            </div>
          ))}
        </div>
      ) : visiveis.length === 0 ? (
        filtrando ? (
          <EmptyState search title="Nenhuma rota encontrada" description={termo ? `Nada encontrado para “${busca}” neste filtro.` : 'Nenhuma rota cadastrada neste tipo de trajeto.'} action={<Button variant="gray" size="sm" icon={X} onClick={limpar}>Limpar filtros</Button>} />
        ) : (
          <EmptyState title="Nenhuma rota cadastrada" description="Cadastre a primeira rota para guardar os valores de pedágio." action={<Button size="sm" icon={Plus} onClick={onNew}>Nova rota</Button>} />
        )
      ) : (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="card divide-y divide-slate-700/80 overflow-hidden">
            {visiveis.map((p) => (
              <PedagioRow key={p.id} rota={p} onOpen={onOpen} />
            ))}
          </div>
          <p className="text-center text-[13px] text-slate-500">{visiveis.length} {visiveis.length === 1 ? 'rota' : 'rotas'}</p>
        </motion.div>
      )}
    </>
  )
}
