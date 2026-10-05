import { useEffect, useRef, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Command } from 'cmdk'
import { Check, ChevronDown, Copy, Mail, Plus, Search } from 'lucide-react'
import { ExportIcon, ImportIcon } from './ui/icons'
import { useToast } from '../contexts/ToastContext'
import { dadosDoProcesso, FRASES, montarStatus, saudacao } from '../lib/status'
import Button from './ui/Button'
import EmptyState from './ui/EmptyState'

const RASCUNHO = 'logitrack-status-rascunho'

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

// STATUS PARA CLIENTES: escolhe o processo, escreve a mensagem e copia o
// e-mail pronto (assunto + corpo formatado) para colar no Outlook/Gmail.
// O rascunho fica salvo neste navegador até ser trocado. Vindo do botão
// "Status" da ficha, a tela é recriada (key) já com aquele processo.
export default function StatusClientes({ processes, loading, procInicial }) {
  const showToast = useToast()
  const textoRef = useRef(null)
  const ativos = processes
    .filter((p) => p.status === 'active' || p.id === procInicial)
    .sort((a, b) => dadosDoProcesso(a).cliente.localeCompare(dadosDoProcesso(b).cliente, 'pt-BR'))

  const [procId, setProcId] = useState(() => procInicial || lerRascunho().procId || '')
  const [mensagem, setMensagem] = useState(() => lerRascunho().mensagem || `${saudacao()} a todos.\n`)

  useEffect(() => {
    try {
      localStorage.setItem(RASCUNHO, JSON.stringify({ procId, mensagem }))
    } catch { /* navegador sem localStorage */ }
  }, [procId, mensagem])

  const proc = ativos.find((p) => p.id === procId)
  const email = proc ? montarStatus(proc, mensagem) : null

  // Acrescenta a frase numa linha nova e seleciona o "__" para completar.
  const inserirFrase = (frase) => {
    const base = mensagem.trimEnd()
    const novo = `${base}${base ? '\n' : ''}${frase}`
    setMensagem(novo)
    requestAnimationFrame(() => {
      const el = textoRef.current
      if (!el) return
      el.focus()
      const i = novo.lastIndexOf('__')
      if (i >= base.length) el.setSelectionRange(i, i + 2)
      else el.setSelectionRange(novo.length, novo.length)
    })
  }

  const copiar = async (conteudo, aviso) => {
    try {
      if (conteudo.html && window.ClipboardItem && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([conteudo.html], { type: 'text/html' }),
            'text/plain': new Blob([conteudo.texto], { type: 'text/plain' }),
          }),
        ])
      } else {
        await navigator.clipboard.writeText(conteudo.texto)
      }
      showToast(aviso)
    } catch {
      if (copiarPorSelecao(conteudo)) showToast(aviso)
      else showToast('Não foi possível copiar. Selecione o texto da prévia e copie manualmente.', 'error')
    }
  }

  const abrirNoEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(email.assunto)}&body=${encodeURIComponent(email.texto)}`
  }

  if (!loading && ativos.length === 0) {
    return <EmptyState title="Nenhum processo em andamento" description="Os processos ativos aparecem aqui para enviar o status ao cliente." />
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <section className="min-w-0 space-y-5">
        <div>
          <label className="label">Processo</label>
          <EscolherProcesso processos={ativos} valor={procId} onChange={setProcId} />
        </div>

        <div>
          <label htmlFor="status-mensagem" className="label">Mensagem</label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {FRASES.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => inserirFrase(f)}
                className="inline-flex items-center gap-1 rounded-full bg-navy-700/70 px-2.5 py-1 text-[12.5px] text-slate-300 transition-colors hover:bg-navy-700 hover:text-ink"
              >
                <Plus className="size-3" strokeWidth={2.6} />
                {f.replace(' às __h', '')}
              </button>
            ))}
          </div>
          <textarea
            id="status-mensagem"
            ref={textoRef}
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            rows={7}
            maxLength={3000}
            placeholder="Ex.: Bom dia a todos. Carregamento liberado e veículo está em rota com previsão de entrega às 15h."
            className="field min-h-40 resize-y leading-relaxed"
          />
          <div className="mt-1.5 flex justify-between text-[12px] text-slate-500">
            <span>O rascunho fica salvo neste navegador.</span>
            <button type="button" className="text-blue-500 hover:opacity-80" onClick={() => setMensagem(`${saudacao()} a todos.\n`)}>
              Limpar mensagem
            </button>
          </div>
        </div>
      </section>

      <section className="min-w-0">
        <label className="label">Prévia do e-mail</label>
        <div className="card overflow-hidden">
          {email ? (
            <>
              <div className="flex items-start gap-3 border-b border-slate-700/70 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Assunto</div>
                  <div className="mt-0.5 text-[14px] font-medium text-ink">{email.assunto}</div>
                </div>
                <Button variant="ghost" size="sm" icon={Copy} onClick={() => copiar({ texto: email.assunto }, 'Assunto copiado.')} aria-label="Copiar assunto">
                  <span className="max-sm:hidden">Assunto</span>
                </Button>
              </div>
              {/* Mesmo HTML que vai para a área de transferência (texto já escapado). */}
              <div className="max-h-[420px] overflow-y-auto bg-white px-4 py-4 text-[#1d1d1f]" dangerouslySetInnerHTML={{ __html: email.html }} />
            </>
          ) : (
            <p className="px-4 py-10 text-center text-sm text-slate-500">Selecione um processo para ver o e-mail.</p>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="lg" icon={Copy} disabled={!email} onClick={() => copiar(email, 'E-mail copiado. É só colar na mensagem.')} className="flex-1">
            Copiar e-mail
          </Button>
          <Button size="lg" variant="gray" icon={Mail} disabled={!email} onClick={abrirNoEmail}>
            Abrir no e-mail
          </Button>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-slate-500">
          “Copiar e-mail” leva o texto já formatado (cole no corpo da mensagem). “Abrir no e-mail” cria a mensagem no programa de e-mail do computador, com assunto e texto preenchidos.
        </p>
      </section>
    </div>
  )
}
