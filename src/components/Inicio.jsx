import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { CalendarClock, ChevronRight, Mail, Plus, ReceiptText, Route, TriangleAlert } from 'lucide-react'
import { ExportIcon, ImportIcon } from './ui/icons'
import { agendaDoDia, quandoRelativo } from '../lib/etapas'
import { dadosDoProcesso } from '../lib/status'

const pad = (n) => String(n).padStart(2, '0')
const hora = (t) => {
  const d = new Date(t)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const MAX_POR_SECAO = 6

// Indicador clicável no topo (mesmo visual do resumo das listas).
function Indicador({ icon: Icon, valor, rotulo, cor, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card flex flex-col gap-2.5 p-3.5 text-left transition-[box-shadow,transform] duration-200 hover:shadow-lift active:scale-[0.98] sm:p-4"
    >
      <span className={`flex size-7 items-center justify-center rounded-full text-white ${valor ? cor : 'bg-slate-500/40'}`}>
        <Icon className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
      </span>
      <span>
        <span className="block font-display text-[26px] font-bold leading-none tracking-tight tabular-nums text-ink">{valor}</span>
        <span className="mt-1 block text-[12.5px] font-medium leading-tight text-slate-400">{rotulo}</span>
      </span>
    </button>
  )
}

// Uma linha da agenda: horário, o que acontece, cliente e contêiner.
function Compromisso({ item, atrasado, onOpen, now }) {
  const { cliente } = dadosDoProcesso(item.proc)
  const Icon = item.proc.type === 'import' ? ImportIcon : ExportIcon
  return (
    <button
      type="button"
      onClick={() => onOpen(item.proc.id)}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-navy-700/40 active:bg-navy-700/70"
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

function SecaoAgenda({ id, titulo, tom, itens, vazio, atrasado, onOpen, now }) {
  if (!itens.length && !vazio) return null
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-1.5 flex items-baseline gap-2 px-1">
        <h2 className={`font-display text-[17px] font-semibold tracking-[-0.015em] ${tom}`}>{titulo}</h2>
        {itens.length > 0 && <span className="text-[13px] font-medium tabular-nums text-slate-500">{itens.length}</span>}
      </div>
      {itens.length ? (
        <div className="card divide-y divide-slate-700/80 overflow-hidden">
          {itens.slice(0, MAX_POR_SECAO).map((item, i) => (
            <Compromisso key={`${item.proc.id}-${item.rotulo}-${item.numero}-${i}`} item={item} atrasado={atrasado} onOpen={onOpen} now={now} />
          ))}
          {itens.length > MAX_POR_SECAO && (
            <p className="px-4 py-2 text-[12.5px] text-slate-500">e mais {itens.length - MAX_POR_SECAO} — veja nas listas de Importações e Exportações</p>
          )}
        </div>
      ) : (
        <div className="card px-4 py-4 text-[14px] text-slate-500">{vazio}</div>
      )}
    </section>
  )
}

function Atalho({ icon: Icon, rotulo, descricao, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-navy-700/40 active:bg-navy-700/70"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
        <Icon className="size-4" strokeWidth={2.25} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-medium text-ink">{rotulo}</span>
        <span className="block truncate text-[12.5px] text-slate-500">{descricao}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-slate-500/70" strokeWidth={2.4} aria-hidden="true" />
    </button>
  )
}

// PÁGINA INICIAL: visão do dia — quanto está em andamento, o que atrasou,
// o que acontece hoje e amanhã, e atalhos para o que mais se usa.
export default function Inicio({ processes, loading, onOpen, onIr, onNovo }) {
  // Relógio da agenda: atualiza a cada minuto com a página aberta.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  const ativos = processes.filter((p) => p.status === 'active')
  const agenda = agendaDoDia(ativos, now)
  const rolarPara = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card h-[104px] animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-7">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador icon={ImportIcon} valor={ativos.filter((p) => p.type === 'import').length} rotulo="Importações em andamento" cor="bg-blue-500" onClick={() => onIr('import')} />
        <Indicador icon={ExportIcon} valor={ativos.filter((p) => p.type === 'export').length} rotulo="Exportações em andamento" cor="bg-blue-500" onClick={() => onIr('export')} />
        <Indicador icon={TriangleAlert} valor={agenda.atrasados.length} rotulo="Atrasados" cor="bg-red-500" onClick={() => rolarPara('agenda-atrasados')} />
        <Indicador icon={CalendarClock} valor={agenda.hoje.length} rotulo="Compromissos hoje" cor="bg-yellow-500" onClick={() => rolarPara('agenda-hoje')} />
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 space-y-6">
          <SecaoAgenda id="agenda-atrasados" titulo="Atrasados" tom="text-red-500" itens={agenda.atrasados} atrasado onOpen={onOpen} now={now} />
          <SecaoAgenda id="agenda-hoje" titulo="Hoje" tom="text-ink" itens={agenda.hoje} vazio="Nada agendado para hoje." onOpen={onOpen} now={now} />
          <SecaoAgenda id="agenda-amanha" titulo="Amanhã" tom="text-ink" itens={agenda.amanha} vazio="Nada agendado para amanhã." onOpen={onOpen} now={now} />
        </div>

        <section className="min-w-0">
          <div className="mb-1.5 px-1">
            <h2 className="font-display text-[17px] font-semibold tracking-[-0.015em] text-ink">Atalhos</h2>
          </div>
          <div className="card divide-y divide-slate-700/80 overflow-hidden">
            <Atalho icon={Plus} rotulo="Novo processo" descricao="Importação ou exportação" onClick={onNovo} />
            <Atalho icon={Mail} rotulo="Status para clientes" descricao="Imagem de status para o e-mail" onClick={() => onIr('status')} />
            <Atalho icon={ReceiptText} rotulo="Fretes para CTE" descricao="Valores de cada cliente" onClick={() => onIr('fretes')} />
            <Atalho icon={Route} rotulo="Rotas e Valores de Pedágio" descricao="Pedágio por rota e eixos" onClick={() => onIr('pedagios')} />
          </div>
        </section>
      </div>
    </motion.div>
  )
}
