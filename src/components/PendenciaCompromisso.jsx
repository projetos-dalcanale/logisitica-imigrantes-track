import { Link2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { quandoDia } from '../lib/pendencias'
import { marcarFeita } from '../lib/pendenciasDb'
import Checkbox from './ui/Checkbox'

// Uma pendência na agenda do Início: a caixa conclui ali mesmo, o título abre a
// edição e o processo vinculado (se houver) abre a ficha dele. O dia e o
// processo ficam na segunda linha, para o título ter a largura toda.
export default function PendenciaCompromisso({ item, atrasada, onEditar, onAbrirProcesso }) {
  const { user } = useAuth()
  const showToast = useToast()
  const concluir = async (feito) => {
    try {
      await marcarFeita(item.id, feito, user.email)
    } catch (err) {
      console.error('Erro ao atualizar pendência:', err)
      showToast('Não foi possível atualizar a pendência.', 'error')
    }
  }
  return (
    <div className="flex w-full items-center gap-3 px-4 py-2.5 transition-colors hover:bg-navy-700/40 xl:py-2">
      <span className="flex w-[74px] shrink-0 items-center">
        <Checkbox id={`pend-inicio-${item.id}`} tone="success" checked={!!item.feito} label={`Marcar “${item.titulo}” como feita`} onChange={concluir} />
      </span>
      <div className="min-w-0 flex-1">
        <button type="button" onClick={() => onEditar(item.id)} className="flex w-full items-center gap-2 text-left text-[14.5px] font-medium text-ink">
          <span className="min-w-0 truncate">{item.titulo}</span>
          <span className="shrink-0 rounded-full bg-navy-700/70 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">Pendência</span>
        </button>
        <div className="flex items-center gap-2 text-[12.5px]">
          <span className={`shrink-0 ${atrasada ? 'font-medium text-red-500' : 'text-slate-500'}`}>{atrasada ? quandoDia(item.data) : 'Dia todo'}</span>
          {item.processoRotulo && (
            <button
              type="button"
              onClick={() => onAbrirProcesso(item.processoId)}
              title="Abrir o processo"
              className="flex min-w-0 items-center gap-1 text-slate-400 transition-colors hover:text-ink"
            >
              <Link2 className="size-3.5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
              <span className="truncate">{item.processoRotulo}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
