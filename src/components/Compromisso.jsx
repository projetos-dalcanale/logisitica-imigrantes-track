import { ChevronRight } from 'lucide-react'
import { ExportIcon, ImportIcon } from './ui/icons'
import { quandoRelativo } from '../lib/etapas'
import { dadosDoProcesso } from '../lib/status'

const pad = (n) => String(n).padStart(2, '0')
const hora = (t) => {
  const d = new Date(t)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Uma linha da agenda: horário, o que acontece, cliente e contêiner.
export default function Compromisso({ item, atrasado, onOpen, now }) {
  const { cliente } = dadosDoProcesso(item.proc)
  const Icon = item.proc.type === 'import' ? ImportIcon : ExportIcon
  return (
    <button
      type="button"
      onClick={() => onOpen(item.proc.id)}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-navy-700/40 active:bg-navy-700/70 xl:py-2"
    >
      <span className={`w-[74px] shrink-0 text-[13px] font-semibold tabular-nums ${atrasado ? 'text-red-500' : 'text-ink'}`}>
        {atrasado ? quandoRelativo(item.t, now) : hora(item.t)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-medium text-ink">
          {item.rotulo} <span className="font-normal text-slate-400">· {cliente || 'Sem nome'}</span>
        </span>
        <span className="flex items-center gap-1.5 truncate text-[12.5px] text-slate-500">
          <Icon className="size-3.5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
          <span className="truncate font-mono">{item.numero || 'Sem contêiner'}</span>
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-slate-500/70" strokeWidth={2.4} aria-hidden="true" />
    </button>
  )
}
