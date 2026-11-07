import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ChevronRight, ClipboardList, TriangleAlert } from 'lucide-react'
import { ExportIcon, ImportIcon } from './ui/icons'
import { agendaDoDia } from '../lib/etapas'
import { agendaPendencias, quandoDia } from '../lib/pendencias'
import Compromisso from './Compromisso'
import PendenciaCompromisso from './PendenciaCompromisso'
import SemanaChart from './SemanaChart'

// Quantas pendências de "Próximos dias" e quantos processos atrasados aparecem
// no Início; o resto fica nas abas.
const MAX_PROXIMAS = 5
const MAX_PROCESSOS_ATRASADOS = 6

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

// Um grupo dentro do cartão de pendências (Atrasadas, Hoje, Amanhã, Próximos dias).
function GrupoPendencias({ id, titulo, tom = 'text-slate-400', itens, vazio, max, quando, atrasada, onVerTodas, onEditar, onAbrirProcesso }) {
  if (!itens.length && !vazio) return null
  const visiveis = max ? itens.slice(0, max) : itens
  const restantes = itens.length - visiveis.length
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-20">
      <h3 id={`${id}-titulo`} className={`flex items-baseline gap-2 px-4 pb-1 pt-3 text-[12.5px] font-semibold ${tom}`}>
        {titulo}
        {itens.length > 0 && <span className="font-medium tabular-nums text-slate-500">{itens.length}</span>}
      </h3>
      {itens.length ? (
        <div className="divide-y divide-slate-700/80">
          {visiveis.map((item) => (
            <PendenciaCompromisso key={item.id} item={item} quando={quando?.(item)} atrasada={atrasada} onEditar={onEditar} onAbrirProcesso={onAbrirProcesso} />
          ))}
          {restantes > 0 && (
            <button type="button" onClick={onVerTodas} className="w-full px-4 py-2 text-left text-[12.5px] text-slate-500 transition-colors hover:text-ink">
              e mais {restantes} — ver na aba Pendências
            </button>
          )}
        </div>
      ) : (
        <p className="px-4 pb-3 text-[14px] text-slate-500">{vazio}</p>
      )}
    </section>
  )
}

// PÁGINA INICIAL: visão do dia. As pendências da equipe ficam em destaque, na
// coluna maior; ao lado, a semana dos processos e o que deles está atrasado.
export default function Inicio({ processes, loading, onOpen, onIr, pendencias = [], onEditarPendencia, onAbrirProcesso }) {
  // Relógio da agenda: atualiza a cada minuto com a página aberta.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  const ativos = processes.filter((p) => p.status === 'active')
  const atrasados = agendaDoDia(ativos, now).atrasados
  const pend = agendaPendencias(pendencias, now)
  const abertas = pend.atrasadas.length + pend.hoje.length + pend.amanha.length + pend.proximas.length
  const rolarPara = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const verPendencias = () => onIr('pendencias')
  const acoes = { onEditar: onEditarPendencia, onAbrirProcesso, onVerTodas: verPendencias }

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
        <Indicador
          icon={TriangleAlert}
          valor={atrasados.length + pend.atrasadas.length}
          rotulo="Atrasados"
          cor="bg-red-500"
          onClick={() => rolarPara(pend.atrasadas.length || !atrasados.length ? 'pend-atrasadas' : 'processos-atrasados')}
        />
        <Indicador icon={ClipboardList} valor={pend.hoje.length} rotulo="Pendências hoje" cor="bg-yellow-500" onClick={() => rolarPara('pend-hoje')} />
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] xl:gap-6">
        <section aria-labelledby="pendencias-titulo" className="min-w-0">
          <div className="mb-1.5 flex items-baseline gap-2 px-1">
            <h2 id="pendencias-titulo" className="font-display text-[17px] font-semibold tracking-[-0.015em] text-ink">Pendências</h2>
            {abertas > 0 && <span className="text-[13px] font-medium tabular-nums text-slate-500">{abertas} em aberto</span>}
            <button type="button" onClick={verPendencias} className="ml-auto flex items-center gap-0.5 text-[13px] font-medium text-slate-400 transition-colors hover:text-ink">
              Abrir Pendências
              <ChevronRight className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
            </button>
          </div>
          <div className="card divide-y divide-slate-700/80 overflow-hidden pb-1">
            <GrupoPendencias id="pend-atrasadas" titulo="Atrasadas" tom="text-red-500" itens={pend.atrasadas} atrasada quando={(x) => quandoDia(x.data, now)} {...acoes} />
            <GrupoPendencias id="pend-hoje" titulo="Hoje" tom="text-ink" itens={pend.hoje} vazio="Nada para hoje." {...acoes} />
            <GrupoPendencias id="pend-amanha" titulo="Amanhã" itens={pend.amanha} {...acoes} />
            <GrupoPendencias id="pend-proximas" titulo="Próximos dias" itens={pend.proximas} max={MAX_PROXIMAS} quando={(x) => quandoDia(x.data, now)} {...acoes} />
          </div>
        </section>

        <div className="min-w-0 space-y-6">
          <SemanaChart processes={processes} now={now} onOpen={onOpen} />

          {atrasados.length > 0 && (
            <section id="processos-atrasados" aria-labelledby="processos-atrasados-titulo" className="scroll-mt-20">
              <div className="mb-1.5 flex items-baseline gap-2 px-1">
                <h2 id="processos-atrasados-titulo" className="font-display text-[17px] font-semibold tracking-[-0.015em] text-red-500">Processos atrasados</h2>
                <span className="text-[13px] font-medium tabular-nums text-slate-500">{atrasados.length}</span>
              </div>
              <div className="card divide-y divide-slate-700/80 overflow-hidden">
                {atrasados.slice(0, MAX_PROCESSOS_ATRASADOS).map((item, i) => (
                  <Compromisso key={`${item.proc.id}-${item.rotulo}-${item.numero}-${i}`} item={item} atrasado onOpen={onOpen} now={now} />
                ))}
                {atrasados.length > MAX_PROCESSOS_ATRASADOS && (
                  <p className="px-4 py-2 text-[12.5px] text-slate-500">e mais {atrasados.length - MAX_PROCESSOS_ATRASADOS} — veja nas listas de Importações e Exportações</p>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </motion.div>
  )
}
