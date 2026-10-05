import { useEffect, useRef, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Command } from 'cmdk'
import { Check, ChevronDown, Copy, Download, Plus, Search, Type } from 'lucide-react'
import { ExportIcon, ImportIcon } from './ui/icons'
import { useToast } from '../contexts/ToastContext'
import { dadosDoProcesso, montarStatus } from '../lib/status'
import { desenharStatus, imagemDoCanvas, LARGURA, opcoesDeStatus } from '../lib/statusImagem'
import Button from './ui/Button'
import EmptyState from './ui/EmptyState'

const RASCUNHO = 'logitrack-status-rascunho'
const FRASES_DETALHES = ['Previsão de entrega às __h.', 'Previsão de chegada ao terminal às __h.', 'Motorista: __.']

const lerRascunho = () => {
  try {
    return JSON.parse(localStorage.getItem(RASCUNHO) || '{}')
  } catch {
    return {}
  }
}

// Plano B para copiar quando o navegador bloqueia a área de transferência
// moderna: seleciona um elemento escondido e usa o "copiar" clássico, que
// também leva a formatação.
const copiarPorSelecao = ({ html, texto }) => {
  const el = document.createElement(html ? 'div' : 'textarea')
  el.className = 'fixed -left-[9999px] top-0'
  if (html) {
    el.contentEditable = 'true'
    el.innerHTML = html
  } else {
    el.value = texto
  }
  document.body.appendChild(el)
  const selecao = window.getSelection()
  if (html) {
    const faixa = document.createRange()
    faixa.selectNodeContents(el)
    selecao.removeAllRanges()
    selecao.addRange(faixa)
  } else {
    el.select()
  }
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  selecao.removeAllRanges()
  el.remove()
  return ok
}

const resumoDoc = (proc) => {
  const { documento, containers } = dadosDoProcesso(proc)
  return [documento && `${documento.rotulo} ${documento.numero}`, containers.join(', ')].filter(Boolean).join(' · ')
}

// Seleção do processo com busca por cliente, documento ou contêiner.
function EscolherProcesso({ processos, valor, onChange }) {
  const [aberto, setAberto] = useState(false)
  const atual = processos.find((p) => p.id === valor)
  return (
    <Popover.Root open={aberto} onOpenChange={setAberto}>
      <Popover.Trigger asChild>
        <button type="button" className="field flex min-h-12 items-center justify-between gap-3 text-left">
          {atual ? (
            <span className="min-w-0">
              <span className="block truncate font-medium text-ink">{dadosDoProcesso(atual).cliente || 'Sem nome'}</span>
              <span className="block truncate text-[12.5px] text-slate-400">{resumoDoc(atual) || '—'}</span>
            </span>
          ) : (
            <span className="text-slate-500">Selecione o processo</span>
          )}
          <ChevronDown className={`size-4 shrink-0 text-slate-500 transition-transform ${aberto ? 'rotate-180' : ''}`} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-[70] w-[var(--radix-popover-trigger-width)] min-w-[280px] overflow-hidden rounded-xl bg-navy-800 shadow-lift ring-[0.5px] ring-black/5 dark:ring-white/10 data-[state=open]:animate-[pop-in_.14s_ease-out]"
        >
          <Command loop>
            <div className="flex items-center gap-2 border-b border-slate-700/70 px-3">
              <Search className="size-4 text-slate-500" />
              <Command.Input placeholder="Cliente, DTA/DI/DUIMP, booking ou contêiner" className="h-10 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-slate-500" />
            </div>
            <Command.List className="custom-scrollbar max-h-72 overflow-y-auto p-1.5">
              <Command.Empty className="py-6 text-center text-sm text-slate-500">Nenhum processo encontrado.</Command.Empty>
              {processos.map((p) => {
                const { cliente } = dadosDoProcesso(p)
                const Icon = p.type === 'import' ? ImportIcon : ExportIcon
                return (
                  <Command.Item
                    key={p.id}
                    value={`${cliente} ${resumoDoc(p)} ${p.id}`}
                    onSelect={() => {
                      onChange(p.id)
                      setAberto(false)
                    }}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-1.5"
                  >
                    <span className="cmdk-icon flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                      <Icon className="size-4" strokeWidth={2.25} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{cliente || 'Sem nome'}</span>
                      <span className="block truncate text-xs text-slate-500">{resumoDoc(p) || '—'}</span>
                    </span>
                    {p.id === valor && <Check className="size-4 shrink-0 text-blue-500" strokeWidth={2.6} />}
                  </Command.Item>
                )
              })}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}


// STATUS PARA CLIENTES: escolhe o processo e a situação e gera uma imagem
// nas cores da empresa (com barra de progresso e os dados do processo) para
// copiar e colar no e-mail do cliente. O rascunho fica salvo neste
// navegador. Vindo do botão "Status" da ficha, a tela é recriada (key) já
// com aquele processo.
export default function StatusClientes({ processes, loading, procInicial }) {
  const showToast = useToast()
  const detalhesRef = useRef(null)
  const canvasRef = useRef(null)
  const ativos = processes
    .filter((p) => p.status === 'active' || p.id === procInicial)
    .sort((a, b) => dadosDoProcesso(a).cliente.localeCompare(dadosDoProcesso(b).cliente, 'pt-BR'))

  const rascunho = lerRascunho()
  const [procId, setProcId] = useState(() => procInicial || rascunho.procId || '')
  const [statusId, setStatusId] = useState(() => rascunho.statusId || '')
  const [titulo, setTitulo] = useState(() => rascunho.titulo || '')
  const [detalhes, setDetalhes] = useState(() => rascunho.detalhes || '')
  const [fontesProntas, setFontesProntas] = useState(false)

  const proc = ativos.find((p) => p.id === procId)
  const opcoes = proc ? opcoesDeStatus(proc) : []
  const opcao = opcoes.find((o) => o.id === statusId) || null

  useEffect(() => {
    try {
      localStorage.setItem(RASCUNHO, JSON.stringify({ procId, statusId, titulo, detalhes }))
    } catch { /* navegador sem localStorage */ }
  }, [procId, statusId, titulo, detalhes])

  // A imagem usa a fonte do app; espera ela carregar antes de desenhar.
  useEffect(() => {
    let vivo = true
    Promise.all([document.fonts.load('700 28px "Inter Variable"'), document.fonts.load('400 16px "Inter Variable"')])
      .catch(() => {})
      .finally(() => vivo && setFontesProntas(true))
    return () => {
      vivo = false
    }
  }, [])

  useEffect(() => {
    if (!proc || !opcao || !canvasRef.current) return
    desenharStatus(canvasRef.current, { proc, titulo: titulo.trim() || opcao.titulo, detalhes: detalhes.trim(), etapa: opcao.etapa })
  }, [proc, opcao, titulo, detalhes, fontesProntas])

  const escolherStatus = (o) => {
    setStatusId(o.id)
    setTitulo(o.titulo)
  }

  const escolherProcesso = (id) => {
    setProcId(id)
    // A lista de situações muda entre importação e exportação.
    const novo = ativos.find((p) => p.id === id)
    if (novo && !opcoesDeStatus(novo).some((o) => o.id === statusId)) {
      setStatusId('')
      setTitulo('')
    }
  }

  // Acrescenta a frase numa linha nova e seleciona o "__" para completar.
  const inserirFrase = (frase) => {
    const base = detalhes.trimEnd()
    const novo = `${base}${base ? '\n' : ''}${frase}`
    setDetalhes(novo)
    requestAnimationFrame(() => {
      const el = detalhesRef.current
      if (!el) return
      el.focus()
      const i = novo.lastIndexOf('__')
      if (i >= base.length) el.setSelectionRange(i, i + 2)
    })
  }

  const textoParaEmail = () => montarStatus(proc, [titulo.trim() || opcao.titulo, detalhes.trim()].filter(Boolean).join('\n'))

  const copiarImagem = async () => {
    const canvas = canvasRef.current
    try {
      // O Blob vai como promessa para o navegador manter a permissão do clique.
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': imagemDoCanvas(canvas) })])
      showToast('Imagem copiada. É só colar no e-mail.')
    } catch {
      const html = `<img src="${canvas.toDataURL('image/png')}" width="${LARGURA}" alt="${(titulo || opcao.titulo).replace(/"/g, '')}">`
      if (copiarPorSelecao({ html })) showToast('Imagem copiada. É só colar no e-mail.')
      else showToast('Não foi possível copiar. Use “Baixar imagem” e anexe no e-mail.', 'error')
    }
  }

  const baixarImagem = async () => {
    const blob = await imagemDoCanvas(canvasRef.current)
    const url = URL.createObjectURL(blob)
    const nome = `status-${dadosDoProcesso(proc).cliente || 'processo'}`.normalize('NFD').replace(/[^\w-]+/g, '-').toLowerCase()
    const a = document.createElement('a')
    a.href = url
    a.download = `${nome}.png`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const copiarTexto = async (texto, aviso) => {
    try {
      await navigator.clipboard.writeText(texto)
      showToast(aviso)
    } catch {
      if (copiarPorSelecao({ texto })) showToast(aviso)
      else showToast('Não foi possível copiar.', 'error')
    }
  }

  if (!loading && ativos.length === 0) {
    return <EmptyState title="Nenhum processo em andamento" description="Os processos ativos aparecem aqui para enviar o status ao cliente." />
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <section className="min-w-0 space-y-5">
        <div>
          <label className="label">Processo</label>
          <EscolherProcesso processos={ativos} valor={procId} onChange={escolherProcesso} />
        </div>

        {proc && (
          <div>
            <label className="label">Situação</label>
            <div className="flex flex-wrap gap-1.5">
              {opcoes.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => escolherStatus(o)}
                  className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${o.id === statusId ? 'bg-blue-500 text-white shadow-sm' : 'bg-navy-700/70 text-slate-300 hover:bg-navy-700 hover:text-ink'}`}
                >
                  {o.id === 'outro' ? 'Outro' : o.titulo}
                </button>
              ))}
            </div>
          </div>
        )}

        {opcao && (
          <>
            <div>
              <label htmlFor="status-titulo" className="label">Título</label>
              <input id="status-titulo" type="text" value={titulo} maxLength={80} onChange={(e) => setTitulo(e.target.value)} placeholder={opcao.titulo} className="field" />
            </div>
            <div>
              <label htmlFor="status-detalhes" className="label">Detalhes (opcional)</label>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {FRASES_DETALHES.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => inserirFrase(f)}
                    className="inline-flex items-center gap-1 rounded-full bg-navy-700/70 px-2.5 py-1 text-[12.5px] text-slate-300 transition-colors hover:bg-navy-700 hover:text-ink"
                  >
                    <Plus className="size-3" strokeWidth={2.6} />
                    {f.replace(/ (às )?__h?\.?$/, '').replace(/:$/, '')}
                  </button>
                ))}
              </div>
              <textarea
                id="status-detalhes"
                ref={detalhesRef}
                value={detalhes}
                onChange={(e) => setDetalhes(e.target.value)}
                rows={4}
                maxLength={600}
                placeholder="Ex.: Carregamento liberado e veículo em rota, com previsão de entrega às 15h."
                className="field resize-y leading-relaxed"
              />
            </div>
          </>
        )}
      </section>

      <section className="min-w-0">
        <label className="label">Imagem para o e-mail</label>
        {opcao ? (
          <>
            <div className="rounded-2xl bg-navy-700/40 p-3 sm:p-4">
              <canvas ref={canvasRef} className="mx-auto block h-auto w-full max-w-[720px]" role="img" aria-label={`Status: ${titulo || opcao.titulo}`} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="lg" icon={Copy} onClick={copiarImagem} className="flex-1">Copiar imagem</Button>
              <Button size="lg" variant="gray" icon={Download} onClick={baixarImagem}>Baixar</Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <Button variant="plain" size="sm" icon={Copy} className="px-0" onClick={() => copiarTexto(textoParaEmail().assunto, 'Assunto copiado.')}>Copiar assunto</Button>
              <Button variant="plain" size="sm" icon={Type} className="px-0" onClick={() => copiarTexto(textoParaEmail().texto, 'Texto copiado.')}>Copiar como texto</Button>
            </div>
          </>
        ) : (
          <div className="card px-6 py-12 text-center text-sm text-slate-500">
            {proc ? 'Escolha a situação para montar a imagem.' : 'Selecione um processo para começar.'}
          </div>
        )}
      </section>
    </div>
  )
}
