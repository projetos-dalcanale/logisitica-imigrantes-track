import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { CalendarClock, ChevronRight, ClipboardList, Mail, Plus, ReceiptText, Route, TriangleAlert } from 'lucide-react'
import { ExportIcon, ImportIcon } from './ui/icons'
import { agendaDoDia } from '../lib/etapas'
import { agendaPendencias } from '../lib/pendencias'
import { useMediaQuery } from '../hooks/useMediaQuery'
import Compromisso from './Compromisso'
import PendenciaCompromisso from './PendenciaCompromisso'
import SemanaChart from './SemanaChart'

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

// Uma seção da agenda (Atrasados, Hoje, Amanhã): as pendências vêm primeiro (não
// têm horário) e depois os compromissos dos processos. O limite de linhas vale
// para o total.
function SecaoAgenda({ id, titulo, tom, itens, pendencias = [], vazio, atrasado, onOpen, onEditarPendencia, onAbrirProcesso, now, max }) {
  const total = itens.length + pendencias.length
  if (!total && !vazio) return null
  const linhasPendencia = pendencias.slice(0, max)
  const linhasProcesso = itens.slice(0, Math.max(0, max - linhasPendencia.length))
  const restantes = total - linhasPendencia.length - linhasProcesso.length
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-1.5 flex items-baseline gap-2 px-1">
        <h2 className={`font-display text-[17px] font-semibold tracking-[-0.015em] ${tom}`}>{titulo}</h2>
        {total > 0 && <span className="text-[13px] font-medium tabular-nums text-slate-500">{total}</span>}
      </div>
      {total ? (
        <div className="card divide-y divide-slate-700/80 overflow-hidden">
          {linhasPendencia.map((item) => (
            <PendenciaCompromisso key={`pend-${item.id}`} item={item} atrasada={atrasado} onEditar={onEditarPendencia} onAbrirProcesso={onAbrirProcesso} />
          ))}
          {linhasProcesso.map((item, i) => (
            <Compromisso key={`${item.proc.id}-${item.rotulo}-${item.numero}-${i}`} item={item} atrasado={atrasado} onOpen={onOpen} now={now} />
          ))}
          {restantes > 0 && (
            <p className="px-4 py-2 text-[12.5px] text-slate-500">e mais {restantes} — veja nas listas de Importações e Exportações e na aba Pendências</p>
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
// o que acontece hoje e amanhã, a semana e atalhos para o que mais se usa.
// Em tela larga (xl) são três colunas e tudo cabe sem rolar a página.
export default function Inicio({ processes, loading, onOpen, onIr, onNovo, pendencias = [], onEditarPendencia, onAbrirProcesso }) {
  // Relógio da agenda: atualiza a cada minuto com a página aberta.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])
  // Em tela larga a agenda mostra menos linhas por seção (a semana completa o resto).
  const telaLarga = useMediaQuery('(min-width: 1280px)')
  const telaAlta = useMediaQuery('(min-height: 1000px)')
  const maxPorSecao = telaLarga ? (telaAlta ? 3 : 2) : 6

  const ativos = processes.filter((p) => p.status === 'active')
  const agenda = agendaDoDia(ativos, now)
  // Pendências da equipe (sem horário): entram nas mesmas seções e nos mesmos contadores.
  const pend = agendaPendencias(pendencias, now)
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
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-7 xl:space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador icon={ImportIcon} valor={ativos.filter((p) => p.type === 'import').length} rotulo="Importações em andamento" cor="bg-blue-500" onClick={() => onIr('import')} />
        <Indicador icon={ExportIcon} valor={ativos.filter((p) => p.type === 'export').length} rotulo="Exportações em andamento" cor="bg-blue-500" onClick={() => onIr('export')} />
        <Indicador icon={TriangleAlert} valor={agenda.atrasados.length + pend.atrasadas.length} rotulo="Atrasados" cor="bg-red-500" onClick={() => rolarPara('agenda-atrasados')} />
        <Indicador icon={CalendarClock} valor={agenda.hoje.length + pend.hoje.length} rotulo="Compromissos hoje" cor="bg-yellow-500" onClick={() => rolarPara('agenda-hoje')} />
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] xl:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_minmax(0,3fr)] xl:gap-6">
        <div className="min-w-0 space-y-6 xl:space-y-4 lg:row-span-2 xl:row-span-1">
          <SecaoAgenda id="agenda-atrasados" titulo="Atrasados" tom="text-red-500" itens={agenda.atrasados} pendencias={pend.atrasadas} atrasado onOpen={onOpen} onEditarPendencia={onEditarPendencia} onAbrirProcesso={onAbrirProcesso} now={now} max={maxPorSecao} />
          <SecaoAgenda id="agenda-hoje" titulo="Hoje" tom="text-ink" itens={agenda.hoje} pendencias={pend.hoje} vazio="Nada agendado para hoje." onOpen={onOpen} onEditarPendencia={onEditarPendencia} onAbrirProcesso={onAbrirProcesso} now={now} max={maxPorSecao} />
          <SecaoAgenda id="agenda-amanha" titulo="Amanhã" tom="text-ink" itens={agenda.amanha} pendencias={pend.amanha} vazio="Nada agendado para amanhã." onOpen={onOpen} onEditarPendencia={onEditarPendencia} onAbrirProcesso={onAbrirProcesso} now={now} max={maxPorSecao} />
        </div>

        <div className="min-w-0 xl:col-start-2 xl:row-start-1">
          <SemanaChart processes={processes} now={now} onOpen={onOpen} />
        </div>

        <section className="min-w-0 xl:col-start-3 xl:row-start-1">
          <div className="mb-1.5 px-1">
            <h2 className="font-display text-[17px] font-semibold tracking-[-0.015em] text-ink">Atalhos</h2>
          </div>
          <div className="card divide-y divide-slate-700/80 overflow-hidden">
            <Atalho icon={Plus} rotulo="Novo processo" descricao="Importação ou exportação" onClick={onNovo} />
            <Atalho icon={ClipboardList} rotulo="Pendências" descricao="Tarefas do dia a dia da equipe" onClick={() => onIr('pendencias')} />
            <Atalho icon={Mail} rotulo="Status para clientes" descricao="Imagem de status para o e-mail" onClick={() => onIr('status')} />
            <Atalho icon={ReceiptText} rotulo="Fretes para CTE" descricao="Valores de cada cliente" onClick={() => onIr('fretes')} />
            <Atalho icon={Route} rotulo="Rotas e Valores de Pedágio" descricao="Pedágio por rota e eixos" onClick={() => onIr('pedagios')} />
          </div>
        </section>
      </div>
    </motion.div>
  )
}
