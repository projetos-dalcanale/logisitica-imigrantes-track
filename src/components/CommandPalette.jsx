import { Command } from 'cmdk'
import { Archive, ArrowDownToLine, ArrowUpFromLine, CornerDownLeft, ListChecks, LogOut, Moon, Plus, Search } from 'lucide-react'
import Modal from './ui/Modal'

const docDe = (p) =>
  p.type === 'import'
    ? p.documentoTipo ? `${p.documentoTipo} ${p.documentoNumero || ''}` : p.documento || ''
    : p.booking || ''

function Item({ icon: Icon, children, onSelect, value, hint }) {
  return (
    <Command.Item value={value} onSelect={onSelect} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink">
      <Icon className="size-4 shrink-0 text-slate-500" strokeWidth={2} />
      <span className="flex-1 truncate">{children}</span>
      {hint && <span className="kbd">{hint}</span>}
    </Command.Item>
  )
}

// BUSCA RÁPIDA (Ctrl/⌘+K): acha qualquer processo — inclusive arquivados —
// por nome, armador, documento/booking, motorista, placa ou contêiner, e
// dá acesso às ações principais pelo teclado.
export default function CommandPalette({ processes, onClose, onOpenProcess, actions }) {
  const ordenados = [...processes].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'active' ? -1 : 1
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  return (
    <Modal onClose={onClose} title="Busca rápida" size="md" className="self-start mt-[12vh] sm:mt-0 sm:self-auto">
      <Command loop className="flex max-h-[70vh] flex-col">
        <div className="flex items-center gap-3 border-b border-slate-700/70 px-4">
          <Search className="size-5 text-slate-500" />
          <Command.Input
            data-autofocus
            placeholder="Buscar processo, contêiner, booking ou ação…"
            className="h-14 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-slate-500"
          />
          <span className="kbd">Esc</span>
        </div>
        <Command.List className="custom-scrollbar flex-1 overflow-y-auto p-2">
          <Command.Empty className="py-10 text-center text-sm text-slate-500">Nada encontrado.</Command.Empty>

          <Command.Group heading="Processos">
            {ordenados.map((p) => {
              const titulo = (p.type === 'import' ? p.importador : p.exportador) || 'Sem nome'
              const doc = docDe(p)
              const busca = [titulo, p.armador, doc, p.referencia, p.navio, p.motorista, p.placas, ...(p.containers || []).map((c) => c.numero)]
                .filter(Boolean)
                .join(' ')
              const Icon = p.status === 'archived' ? Archive : p.type === 'import' ? ArrowDownToLine : ArrowUpFromLine
              return (
                <Command.Item
                  key={p.id}
                  value={`${busca} ${p.id}`}
                  onSelect={() => onOpenProcess(p.id)}
                  className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5"
                >
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${p.status === 'archived' ? 'bg-slate-500/10 text-slate-500' : 'bg-blue-600/10 text-blue-500'}`}>
                    <Icon className="size-4" strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">{titulo}</div>
                    <div className="truncate text-xs text-slate-500">
                      {[p.armador, doc, p.status === 'archived' && 'Arquivado'].filter(Boolean).join(' · ') || '—'}
                    </div>
                  </div>
                  <CornerDownLeft className="size-4 text-slate-500 opacity-0 group-data-[selected=true]:opacity-100" />
                </Command.Item>
              )
            })}
          </Command.Group>

          <Command.Group heading="Ações">
            <Item icon={Plus} value="novo processo criar" onSelect={actions.novo} hint="N">Novo processo</Item>
            <Item icon={ArrowDownToLine} value="ir importações" onSelect={() => actions.aba('import')} hint="1">Ir para Importações</Item>
            <Item icon={ArrowUpFromLine} value="ir exportações" onSelect={() => actions.aba('export')} hint="2">Ir para Exportações</Item>
            <Item icon={Archive} value="ir arquivados" onSelect={() => actions.aba('archive')} hint="3">Ir para Arquivados</Item>
            <Item icon={ListChecks} value="gerenciar cadastros terminais armadores tipos" onSelect={actions.cadastros}>Gerenciar cadastros</Item>
            <Item icon={Moon} value="alternar tema modo escuro claro" onSelect={actions.tema}>Alternar modo claro/escuro</Item>
            <Item icon={LogOut} value="sair logout" onSelect={actions.sair}>Sair</Item>
          </Command.Group>
        </Command.List>
        <div className="hidden items-center gap-4 border-t border-slate-700/70 px-4 py-2.5 text-xs text-slate-500 sm:flex">
          <span className="flex items-center gap-1.5"><span className="kbd">↑</span><span className="kbd">↓</span> navegar</span>
          <span className="flex items-center gap-1.5"><span className="kbd">↵</span> abrir</span>
          <span className="ml-auto flex items-center gap-1.5"><span className="kbd">/</span> busca na lista</span>
        </div>
      </Command>
    </Modal>
  )
}
