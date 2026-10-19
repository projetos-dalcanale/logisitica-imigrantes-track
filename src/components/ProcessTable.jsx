import { Fragment, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { ExportIcon, ImportIcon } from './ui/icons'
import Checkbox from './ui/Checkbox'
import { TOM_TEXTO } from './ProcessCard'
import { agruparPorUrgencia, quandoRelativo } from '../lib/etapas'
import { COLUNAS, linhaDaTabela, ordenarLinhas } from '../lib/tabela'

// Colunas que somem quando a tabela fica estreita (container query do
// wrapper: vale a largura da tabela, não a da janela, então com o painel
// lateral aberto sobram as colunas principais).
const VISIBILIDADE = {
  conteiner: 'hidden @3xl:table-cell',
  documento: 'hidden @5xl:table-cell',
  armador: 'hidden @5xl:table-cell',
  transporte: 'hidden @6xl:table-cell',
}

const TOM_TITULO = { danger: 'text-red-500', warn: 'text-yellow-500', brand: 'text-blue-500', neutral: 'text-ink', success: 'text-emerald-500' }

const celula = 'max-w-[15rem] truncate px-3 py-2.5 align-middle'

function CabecalhoColuna({ coluna, ordem, onOrdenar }) {
  const ativa = ordem?.coluna === coluna.id
  const Seta = ordem?.direcao === 'desc' ? ArrowDown : ArrowUp
  return (
    <th
      scope="col"
      aria-sort={ativa ? (ordem.direcao === 'desc' ? 'descending' : 'ascending') : 'none'}
      className={`sticky top-14 z-10 bg-navy-800 px-3 py-2 text-left text-[12px] font-semibold ${VISIBILIDADE[coluna.id] || ''}`}
    >
      <button
        type="button"
        onClick={() => onOrdenar(coluna.id)}
        className={`-mx-1 inline-flex items-center gap-1 rounded px-1 transition-colors hover:text-ink ${ativa ? 'text-ink' : 'text-slate-400'}`}
      >
        {coluna.label}
        {ativa && <Seta className="size-3" strokeWidth={2.6} aria-hidden="true" />}
      </button>
    </th>
  )
}

// Quanto falta: barra fina + "feitas/total".
function Etapas({ feitas, total }) {
  if (!total) return <span className="text-slate-500">—</span>
  const completo = feitas === total
  return (
    <span className="flex items-center gap-2">
      <span className="h-1 w-14 overflow-hidden rounded-full bg-slate-500/15" aria-hidden="true">
        <span className={`block h-full rounded-full ${completo ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${(feitas / total) * 100}%` }} />
      </span>
      <span className="text-[12.5px] tabular-nums text-slate-400">{feitas}/{total}</span>
    </span>
  )
}

function Linha({ linha, now, selecionado, marcado, foco, onOpen, onMarcar, onFoco }) {
  const Icon = linha.tipo === 'import' ? ImportIcon : ExportIcon
  const atrasado = linha.prazo !== null && linha.prazo < now
  const vazio = <span className="text-slate-500">—</span>
  const mover = (e, passo) => {
    e.preventDefault()
    const linhas = [...e.currentTarget.closest('tbody').querySelectorAll('tr[data-linha]')]
    const i = linhas.indexOf(e.currentTarget)
    const alvo = passo === 'inicio' ? linhas[0] : passo === 'fim' ? linhas.at(-1) : linhas[i + passo]
    alvo?.focus()
  }
  const aoTeclar = (e) => {
    if (e.target !== e.currentTarget) return
    if (e.key === 'Enter') {
      e.preventDefault()
      onOpen(linha.id)
    } else if (e.key === ' ') {
      e.preventDefault()
      onMarcar(linha.id)
    } else if (e.key === 'ArrowDown') mover(e, 1)
    else if (e.key === 'ArrowUp') mover(e, -1)
    else if (e.key === 'Home') mover(e, 'inicio')
    else if (e.key === 'End') mover(e, 'fim')
  }
  return (
    <tr
      data-linha={linha.id}
      tabIndex={foco ? 0 : -1}
      aria-selected={marcado}
      aria-current={selecionado ? 'true' : undefined}
      onClick={() => onOpen(linha.id)}
      onFocus={(e) => e.target === e.currentTarget && onFoco(linha.id)}
      onKeyDown={aoTeclar}
      className={`cursor-pointer border-t border-slate-700/80 outline-none transition-colors hover:bg-navy-700/40 focus-visible:bg-navy-700/60 focus-visible:shadow-[inset_0_0_0_2px_rgb(var(--blue-500)/0.45)] ${selecionado ? 'bg-blue-500/8' : marcado ? 'bg-navy-700/30' : ''}`}
    >
      <td className="w-10 pl-3 pr-0 align-middle">
        <Checkbox label={`Selecionar ${linha.cliente || 'processo sem nome'}`} checked={marcado} onChange={() => onMarcar(linha.id)} />
      </td>
      <td className={`${celula} font-medium text-ink`}>
        <span className="flex items-center gap-2">
          <Icon className="size-3.5 shrink-0 text-slate-500" strokeWidth={2.2} aria-label={linha.tipo === 'import' ? 'Importação' : 'Exportação'} />
          <span className="truncate">{linha.cliente || <span className="font-normal text-slate-500">Sem nome</span>}</span>
        </span>
      </td>
      <td className={`${celula} text-slate-400 ${VISIBILIDADE.documento}`}>{linha.documento || vazio}</td>
      <td className={`${celula} text-slate-400 ${VISIBILIDADE.conteiner}`}>{linha.conteiner ? <span className="font-mono text-[12.5px]">{linha.conteiner}</span> : vazio}</td>
      <td className={`${celula} text-slate-400 ${VISIBILIDADE.armador}`}>{linha.armador || vazio}</td>
      <td className={`${celula} text-slate-400 ${VISIBILIDADE.transporte}`}>{linha.transporte || vazio}</td>
      <td className={`${celula} whitespace-nowrap`}><Etapas feitas={linha.etapasFeitas} total={linha.etapasTotal} /></td>
      <td className={`${celula} font-medium ${TOM_TEXTO[linha.acao.tom]}`} title={linha.acao.texto}>{linha.acao.texto}</td>
      <td className={`${celula} whitespace-nowrap tabular-nums ${atrasado ? 'font-medium text-red-500' : 'text-slate-400'}`}>
        {linha.prazo !== null ? quandoRelativo(linha.prazo, now) : vazio}
      </td>
    </tr>
  )
}

// LISTA EM TABELA (PC). Sem ordenação escolhida, as linhas ficam separadas por
// urgência como nos cartões; clicar num título ordena (asc → desc → volta).
export default function ProcessTable({ processes, now, onOpen, selecionadoId, selecionados, onAlternarSelecao, onSelecionarTodos, semGrupos }) {
  const [ordem, setOrdem] = useState(null) // { coluna, direcao } | null
  const [focoId, setFocoId] = useState(null)

  const porId = useMemo(() => new Map(processes.map((p) => [p.id, linhaDaTabela(p, now)])), [processes, now])
  const todas = processes.map((p) => porId.get(p.id))

  const ordenar = (coluna) =>
    setOrdem((o) => (o?.coluna !== coluna ? { coluna, direcao: 'asc' } : o.direcao === 'asc' ? { coluna, direcao: 'desc' } : null))

  let blocos
  if (ordem) blocos = [{ id: 'todos', itens: ordenarLinhas(todas, ordem.coluna, ordem.direcao) }]
  else if (semGrupos) blocos = [{ id: 'todos', itens: todas }]
  else blocos = agruparPorUrgencia(processes, now).map((g) => ({ ...g, itens: g.itens.map((p) => porId.get(p.id)) }))

  const primeiro = blocos[0]?.itens[0]?.id
  const todosMarcados = todas.length > 0 && todas.every((l) => selecionados.has(l.id))

  return (
    <div className="@container card">
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr>
            <th scope="col" className="sticky top-14 z-10 w-10 rounded-tl-[18px] bg-navy-800 pl-3 pr-0 py-2 text-left">
              <Checkbox label="Selecionar todos" checked={todosMarcados} onChange={() => onSelecionarTodos(!todosMarcados, todas.map((l) => l.id))} />
            </th>
            {COLUNAS.map((c) => (
              <CabecalhoColuna key={c.id} coluna={c} ordem={ordem} onOrdenar={ordenar} />
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child_td:first-child]:rounded-bl-[18px] [&_tr:last-child_td:last-child]:rounded-br-[18px]">
          {blocos.map((bloco) => (
            <Fragment key={bloco.id}>
              {bloco.label && (
                <tr className="border-t border-slate-700/80">
                  <th scope="rowgroup" colSpan={COLUNAS.length + 1} className="bg-navy-700/30 px-4 py-1.5 text-left">
                    <span className={`font-display text-[13px] font-semibold ${TOM_TITULO[bloco.tom]}`}>{bloco.label}</span>
                    <span className="ml-2 text-[12px] font-medium tabular-nums text-slate-500">{bloco.itens.length}</span>
                  </th>
                </tr>
              )}
              {bloco.itens.map((linha) => (
                <Linha
                  key={linha.id}
                  linha={linha}
                  now={now}
                  selecionado={linha.id === selecionadoId}
                  marcado={selecionados.has(linha.id)}
                  foco={(focoId && porId.has(focoId) ? focoId : primeiro) === linha.id}
                  onOpen={onOpen}
                  onMarcar={onAlternarSelecao}
                  onFoco={setFocoId}
                />
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
