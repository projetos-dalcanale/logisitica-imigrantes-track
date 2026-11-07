import { Link2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { marcarFeita } from '../lib/pendenciasDb'
import Checkbox from './ui/Checkbox'

// Uma pendência no Início: a caixa conclui ali mesmo, o título abre a edição e
// o processo vinculado (se houver) abre a ficha dele. O dia (quando o grupo não
// diz qual é) e o processo ficam na segunda linha, para o título ter a largura toda.
export default function PendenciaCompromisso({ item, quando, atrasada, onEditar, onAbrirProcesso }) {
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
    <div className="flex w-full items-start gap-3 px-4 py-2.5 transition-colors hover:bg-navy-700/40">
      <span className="flex h-[22px] shrink-0 items-center">
        <Checkbox id={`pend-inicio-${item.id}`} tone="success" checked={!!item.feito} label={`Marcar “${item.titulo}” como feita`} onChange={concluir} />
      </span>
      <div className="min-w-0 flex-1">
        <button type="button" onClick={() => onEditar(item.id)} className="block w-full text-left text-[14.5px] font-medium leading-[22px] text-ink">
          {item.titulo}
        </button>
        {(quando || item.processoRotulo) && (
          <div className="flex items-center gap-2 text-[12.5px]">
            {quando && <span className={`shrink-0 ${atrasada ? 'font-medium text-red-500' : 'text-slate-500'}`}>{quando}</span>}
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
        )}
      </div>
    </div>
  )
}
