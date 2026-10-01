import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Building2, CircleAlert, Plus, Search, ShieldCheck, X } from 'lucide-react'
import { RESP_SEGURO, formatarValor } from '../lib/fretes'
import EmptyState from './ui/EmptyState'
import Button from './ui/Button'

function FreteCard({ frete, onOpen }) {
  const campos = frete.campos || []
  const preenchidos = campos.filter((c) => c.valor)
  const destaque = (preenchidos.length ? preenchidos : campos).slice(0, 3)
  const resp = RESP_SEGURO.find((r) => r.value === frete.respSeguro)?.label
  return (
    <button
      type="button"
      onClick={() => onOpen(frete.id)}
      className="card group flex w-full flex-col p-4 text-left transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-slate-600/80 hover:shadow-lift"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-500">
          <Building2 className="size-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold text-ink transition-colors group-hover:text-blue-500">{frete.cliente || 'Sem nome'}</h3>
          <p className="text-xs text-slate-500">{campos.length} {campos.length === 1 ? 'campo' : 'campos'}{frete.observacoes ? ' · com observações' : ''}</p>
        </div>
      </div>
      {destaque.length > 0 && (
        <dl className="mt-3.5 grid grid-cols-3 gap-2 border-t border-slate-700/60 pt-3">
          {destaque.map((c) => (
            <div key={c.id} className="min-w-0">
              <dt className="truncate text-[11px] text-slate-500">{c.label}</dt>
              <dd className={`truncate text-sm font-semibold tabular-nums ${c.valor ? 'text-ink' : 'text-slate-500'}`}>{formatarValor(c.valor, c.tipo)}</dd>
            </div>
          ))}
        </dl>
      )}
      {resp && (
        <div className="mt-3 inline-flex items-center gap-1 text-[11px] text-slate-500">
          <ShieldCheck className="size-3.5" /> Seguro: {resp}
        </div>
      )}
    </button>
  )
}

// CONSULTA DE FRETES: busca por cliente (e observações) e acesso às fichas.
export default function FreteList({ fretes, loading, erro, onOpen, onNew, searchRef }) {
  const [busca, setBusca] = useState('')
  const termo = busca.toLowerCase().trim()
  const visiveis = termo
    ? fretes.filter((f) => [f.cliente, f.observacoes].filter(Boolean).join(' ').toLowerCase().includes(termo))
    : fretes

  if (erro === 'permission-denied') {
    return (
      <div className="card flex gap-3 p-5 text-sm">
        <CircleAlert className="mt-0.5 size-5 shrink-0 text-yellow-500" />
        <div>
          <p className="font-semibold text-ink">A tabela de fretes ainda não está liberada no banco de dados.</p>
          <p className="mt-1 text-slate-400">É preciso publicar as regras atualizadas do Firestore (arquivo firestore_1.rules, trecho "fretes") no Console do Firebase.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Tabela de fretes</h1>
          <p className="text-sm text-slate-500">Valores e peculiaridades de cada cliente, compartilhados com a equipe.</p>
        </div>
        <Button icon={Plus} onClick={onNew}>Novo cliente</Button>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        <input
          ref={searchRef}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && (setBusca(''), e.currentTarget.blur())}
          placeholder="Buscar cliente…"
          className="field h-11 border-slate-700/80 bg-navy-800 pl-10 pr-10 shadow-soft"
        />
        {busca && (
          <button type="button" onClick={() => setBusca('')} aria-label="Limpar busca" className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-navy-700 hover:text-ink">
            <X className="size-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="card h-36 animate-pulse" />)}
        </div>
      ) : visiveis.length === 0 ? (
        termo ? (
          <EmptyState search title="Nenhum cliente encontrado" description={`Nada encontrado para “${busca}”.`} action={<Button variant="secondary" size="sm" icon={X} onClick={() => setBusca('')}>Limpar busca</Button>} />
        ) : (
          <EmptyState title="Nenhum frete cadastrado" description="Cadastre o primeiro cliente para tirar a tabela de fretes do papel." action={<Button size="sm" icon={Plus} onClick={onNew}>Novo cliente</Button>} />
        )
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false} mode="popLayout">
            {visiveis.map((f) => (
              <motion.div key={f.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}>
                <FreteCard frete={f} onOpen={onOpen} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  )
}
