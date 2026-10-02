import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CirclePlus, Pencil, Trash2 } from 'lucide-react'
import { REGISTRY_CONFIG, useRegistries } from '../contexts/RegistriesContext'
import { useToast } from '../contexts/ToastContext'
import { useDialog } from '../contexts/DialogContext'
import Modal, { SheetHeader } from './ui/Modal'
import Button from './ui/Button'
import Segmented from './ui/Segmented'
import SearchField from './ui/SearchField'
import { Group } from './ui/List'
import { IconButton } from './ui/Tooltip'

const TABS = [
  { value: 'cheio', label: 'Carregamento' },
  { value: 'vazio', label: 'Vazio' },
  { value: 'armador', label: 'Armador' },
  { value: 'tipo', label: 'Tipo' },
]

// CADASTROS: adicionar, renomear e excluir itens das listas compartilhadas.
// Acompanha em tempo real edições de outras pessoas.
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
    <Modal onClose={onClose} title="Cadastros" size="md" sheet grouped>
      <SheetHeader title="Cadastros" subtitle="Compartilhados com toda a equipe" right={<Button variant="plain" className="px-1 font-semibold" onClick={onClose}>OK</Button>} />
      <div className="shrink-0 space-y-3 px-4 pb-3 sm:px-6">
        <Segmented size="sm" options={TABS} value={cat} onChange={(c) => (setCat(c), setFiltro(''))} />
        <SearchField value={filtro} onChange={setFiltro} placeholder={`Buscar em ${cfg.label.toLowerCase()}`} />
      </div>
      <div className="custom-scrollbar min-h-48 flex-1 overflow-y-auto px-4 pb-10 sm:px-6">
        <Group
          footer="Renomear ou excluir não altera processos já criados — eles mantêm o nome antigo, marcado como “não cadastrado”."
        >
          <AnimatePresence initial={false}>
            {visiveis.map((nome) => (
              <motion.div key={nome} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="group flex min-h-11 items-center gap-2 px-4">
                <span className="flex-1 truncate text-[15px] text-ink">{nome}</span>
                <div className="flex shrink-0 items-center opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                  <IconButton icon={Pencil} size="sm" label="Renomear" onClick={() => editar(nome)} />
                  <IconButton icon={Trash2} size="sm" label="Excluir" className="text-red-500!" onClick={() => excluir(nome)} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {visiveis.length === 0 && (
            <div className="px-4 py-3 text-[15px] text-slate-500">{lista.length ? 'Nenhum item encontrado.' : `Nenhum item em “${cfg.label}” ainda.`}</div>
          )}
          <button
            type="button"
            onClick={adicionarNovo}
            className="flex min-h-11 w-full items-center gap-3 px-4 text-left text-[15px] text-blue-500 transition-colors hover:bg-navy-700/40"
          >
            <CirclePlus className="size-5 fill-emerald-500 text-white dark:text-navy-800" strokeWidth={2} />
            Adicionar {cfg.novo}
          </button>
        </Group>
      </div>
    </Modal>
  )
}
