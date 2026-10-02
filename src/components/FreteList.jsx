import { useState } from 'react'
import { motion } from 'motion/react'
import { ChevronRight, CircleAlert, Plus, X } from 'lucide-react'
import { formatarValor } from '../lib/fretes'
import EmptyState from './ui/EmptyState'
import Button from './ui/Button'
import SearchField from './ui/SearchField'

const inicial = (nome) => {
  const c = (nome || '#').trim().charAt(0).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  return /[A-Z]/.test(c) ? c : '#'
}

function FreteRow({ frete, onOpen }) {
  const campos = frete.campos || []
  const principal = campos.find((c) => c.valor) || campos[0]
  return (
    <button
      type="button"
      onClick={() => onOpen(frete.id)}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-navy-700/40 active:bg-navy-700/70"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-slate-400 to-slate-500 text-[13px] font-semibold text-white">
        {(frete.cliente || '?').trim().slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-medium text-ink">{frete.cliente || 'Sem nome'}</div>
        <div className="truncate text-[13px] text-slate-400">
          {[`${campos.length} ${campos.length === 1 ? 'campo' : 'campos'}`, frete.observacoes && 'Com observações'].filter(Boolean).join(' · ')}
        </div>
      </div>
      {principal && (
        <div className="hidden text-right sm:block">
          <div className="text-[11px] text-slate-500">{principal.label}</div>
          <div className="text-[14px] font-medium tabular-nums text-ink">{formatarValor(principal.valor, principal.tipo)}</div>
        </div>
      )}
      <ChevronRight className="size-4 shrink-0 text-slate-500/70" strokeWidth={2.4} />
    </button>
  )
}

// CONSULTA DE FRETES: índice de clientes por letra (como o app Contatos),
// com busca por cliente e observações.
export default function FreteList({ fretes, loading, erro, onOpen, onNew, searchRef }) {
  const [busca, setBusca] = useState('')
  const termo = busca.toLowerCase().trim()
  const visiveis = termo ? fretes.filter((f) => [f.cliente, f.observacoes].filter(Boolean).join(' ').toLowerCase().includes(termo)) : fretes

  const grupos = []
  visiveis.forEach((f) => {
    const l = inicial(f.cliente)
    const ultimo = grupos[grupos.length - 1]
    if (ultimo?.letra === l) ultimo.itens.push(f)
    else grupos.push({ letra: l, itens: [f] })
  })

  if (erro === 'permission-denied') {
    return (
      <div className="card flex gap-3 p-5 text-sm">
        <CircleAlert className="mt-0.5 size-5 shrink-0 text-yellow-500" />
        <div>
          <p className="font-semibold text-ink">A tabela de fretes ainda não está liberada no banco de dados.</p>
          <p className="mt-1 text-slate-400">Publique as regras atualizadas do Firestore (arquivo firestore_1.rules, trecho “fretes”) no Console do Firebase.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <SearchField inputRef={searchRef} value={busca} onChange={setBusca} placeholder="Buscar cliente" hint="/" className="mb-5" />

      {loading ? (
        <div className="card divide-y divide-slate-700/80 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex animate-pulse items-center gap-3 px-4 py-3">
              <div className="size-9 rounded-full bg-slate-500/15" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-40 rounded bg-slate-500/15" />
                <div className="h-3 w-56 rounded bg-slate-500/10" />
              </div>
            </div>
          ))}
        </div>
      ) : visiveis.length === 0 ? (
        termo ? (
          <EmptyState search title="Nenhum cliente encontrado" description={`Nada encontrado para “${busca}”.`} action={<Button variant="gray" size="sm" icon={X} onClick={() => setBusca('')}>Limpar busca</Button>} />
        ) : (
          <EmptyState title="Nenhum frete cadastrado" description="Cadastre o primeiro cliente para tirar a tabela de fretes do papel." action={<Button size="sm" icon={Plus} onClick={onNew}>Novo cliente</Button>} />
        )
      ) : (
        <div className="space-y-5">
          {grupos.map((g) => (
            <motion.section key={g.letra} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <h3 className="mb-1.5 px-4 text-[13px] font-semibold text-slate-400">{g.letra}</h3>
              <div className="card divide-y divide-slate-700/80 overflow-hidden">
                {g.itens.map((f) => (
                  <FreteRow key={f.id} frete={f} onOpen={onOpen} />
                ))}
              </div>
            </motion.section>
          ))}
          <p className="text-center text-[13px] text-slate-500">{visiveis.length} {visiveis.length === 1 ? 'cliente' : 'clientes'}</p>
        </div>
      )}
    </>
  )
}
