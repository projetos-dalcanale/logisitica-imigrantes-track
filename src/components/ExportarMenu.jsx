import * as Popover from '@radix-ui/react-popover'
import { useState } from 'react'
import { ClipboardCopy, Download, FileText } from 'lucide-react'
import Button from './ui/Button'

function Item({ icon: Icon, titulo, descricao, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-navy-700/60 focus-visible:bg-navy-700/60 focus-visible:outline-none"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
        <Icon className="size-4" strokeWidth={2.1} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-medium text-ink">{titulo}</span>
        <span className="block text-[12px] text-slate-500">{descricao}</span>
      </span>
    </button>
  )
}

// Menu "Exportar": CSV (abre no Excel) ou copiar a tabela para o e-mail. Atua
// sobre as linhas selecionadas (modo tabela) ou, sem seleção, sobre a lista toda.
export default function ExportarMenu({ total, selecionados, onCsv, onCopiar }) {
  const [aberto, setAberto] = useState(false)
  const alvo = selecionados > 0 ? `${selecionados} ${selecionados === 1 ? 'selecionado' : 'selecionados'}` : `toda a lista (${total})`
  const rodar = (acao) => () => {
    setAberto(false)
    acao()
  }
  return (
    <Popover.Root open={aberto} onOpenChange={setAberto}>
      <Popover.Trigger asChild>
        <Button variant="gray" icon={Download} aria-label="Exportar">
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-[70] w-72 rounded-xl bg-navy-800/95 p-1.5 shadow-lift ring-[0.5px] ring-black/10 backdrop-blur-xl data-[state=open]:animate-[pop-in_.14s_ease-out] dark:ring-white/10"
        >
          <p className="px-2.5 pb-1 pt-1.5 text-[12px] font-medium text-slate-500">Exportar {alvo}</p>
          <Item icon={FileText} titulo="CSV" descricao="Arquivo que abre no Excel" onClick={rodar(onCsv)} />
          <Item icon={ClipboardCopy} titulo="Copiar para e-mail" descricao="Cola como tabela no Outlook ou Excel" onClick={rodar(onCopiar)} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
