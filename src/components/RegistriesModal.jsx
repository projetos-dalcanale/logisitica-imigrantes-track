import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { REGISTRY_CONFIG, useRegistries } from '../contexts/RegistriesContext'
import { useToast } from '../contexts/ToastContext'
import { useDialog } from '../contexts/DialogContext'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Segmented from './ui/Segmented'
import { IconButton } from './ui/Tooltip'

const TABS = [
  { value: 'cheio', label: 'Carregamento' },
  { value: 'vazio', label: 'Vazio' },
  { value: 'armador', label: 'Armador' },
  { value: 'tipo', label: 'Tipo' },
]

// GERENCIAR CADASTROS: adicionar, renomear e excluir itens das listas
// compartilhadas. Acompanha em tempo real edições de outras pessoas.
export default function RegistriesModal({ onClose }) {
  const { lists, adicionar, writeList, sortPt } = useRegistries()
  const { confirm, prompt } = useDialog()
  const showToast = useToast()
  const [cat, setCat] = useState('cheio')
  const [filtro, setFiltro] = useState('')
  const cfg = REGISTRY_CONFIG[cat]
  const lista = lists[cat]
  const visiveis = lista.filter((n) => n.toLowerCase().includes(filtro.toLowerCase().trim()))

  const editar = async (nomeAntigo) => {
    const raw = await prompt({ title: `Renomear ${cfg.novo}`, defaultValue: nomeAntigo, confirmLabel: 'Renomear' })
    if (raw === null) return
    const novoNome = raw.trim().slice(0, 150)
    if (novoNome === nomeAntigo) return
    if (lista.includes(novoNome)) return showToast(`Já existe um item chamado "${novoNome}".`, 'error')
    await writeList(cat, sortPt(lista.map((n) => (n === nomeAntigo ? novoNome : n))))
    showToast(`"${nomeAntigo}" renomeado para "${novoNome}".`)
  }

  const excluir = async (nome) => {
    const ok = await confirm({
      title: `Excluir "${nome}"?`,
      message: `Sai da lista de ${cfg.label}. Processos que já usam esse nome não mudam.`,
      confirmLabel: 'Excluir',
      danger: true,
    })
    if (!ok) return
    await writeList(cat, lista.filter((n) => n !== nome))
    showToast(`"${nome}" excluído.`)
  }

  const adicionarNovo = async () => {
    const nome = await adicionar(cat)
    if (nome) showToast(`"${nome}" adicionado.`)
  }

  return (
    <Modal onClose={onClose} title="Gerenciar cadastros" size="md" fullscreenMobile>
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-700/70 px-5">
        <div>
          <h2 className="text-base font-semibold text-ink">Cadastros</h2>
          <p className="text-xs text-slate-500">Listas compartilhadas com toda a equipe</p>
        </div>
        <IconButton icon={X} label="Fechar" shortcut="Esc" onClick={onClose} />
      </div>
      <div className="shrink-0 space-y-3 px-5 pt-4">
        <Segmented size="sm" options={TABS} value={cat} onChange={(c) => (setCat(c), setFiltro(''))} />
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder={`Filtrar ${cfg.label.toLowerCase()}…`} className="field field-sm pl-9" />
        </div>
      </div>
      <div className="custom-scrollbar min-h-48 flex-1 overflow-y-auto px-5 py-3">
        {visiveis.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            {lista.length ? 'Nenhum item encontrado.' : `Nenhum item em "${cfg.label}" ainda.`}
          </p>
        ) : (
          <ul className="divide-y divide-slate-700/50 overflow-hidden rounded-xl border border-slate-700/60">
            <AnimatePresence initial={false}>
              {visiveis.map((nome) => (
                <motion.li
                  key={nome}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="group flex items-center justify-between gap-2 bg-navy-800 px-3.5 py-2"
                >
                  <span className="truncate text-sm text-ink">{nome}</span>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                    <IconButton icon={Pencil} size="sm" label="Renomear" onClick={() => editar(nome)} />
                    <IconButton icon={Trash2} size="sm" label="Excluir" className="hover:text-red-400! hover:bg-red-400/10!" onClick={() => excluir(nome)} />
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          Renomear ou excluir não altera processos já criados — eles mantêm o nome antigo, marcado como "não cadastrado".
        </p>
      </div>
      <div className="shrink-0 border-t border-slate-700/70 px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
        <Button icon={Plus} className="w-full" onClick={adicionarNovo}>Adicionar {cfg.novo}</Button>
      </div>
    </Modal>
  )
}
