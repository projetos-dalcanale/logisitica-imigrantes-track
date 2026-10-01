import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import * as Popover from '@radix-ui/react-popover'
import { Building2, History, Pencil, Plus, ShieldCheck, Trash2, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useDialog } from '../contexts/DialogContext'
import { useToast } from '../contexts/ToastContext'
import { CAMPOS_PADRAO, RESP_SEGURO, TIPOS_CAMPO, atualizarFrete, criarFrete, excluirFrete, formatarValor, novaFicha } from '../lib/fretes'
import { formatarDataHora } from '../lib/processos'
import Modal from './ui/Modal'
import Button from './ui/Button'
import NumberInput from './ui/NumberInput'
import Segmented from './ui/Segmented'
import { IconButton } from './ui/Tooltip'

const TIPO_OPCOES = Object.entries(TIPOS_CAMPO).map(([value, t]) => ({ value, label: t.label }))

// Menu "Adicionar campo": campos padrão que foram removidos + campo personalizado.
function AdicionarCampo({ campos, onAdd }) {
  const [open, setOpen] = useState(false)
  const faltando = CAMPOS_PADRAO.filter((p) => !campos.some((c) => c.id === p.id))
  const focarId = useRef(null)
  const add = (campo) => {
    if (campo.custom) focarId.current = campo.id
    onAdd(campo)
    setOpen(false)
  }
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button variant="secondary" size="sm" icon={Plus}>Adicionar campo</Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          onCloseAutoFocus={(e) => {
            // Campo personalizado novo: o cursor vai direto pro nome dele.
            if (!focarId.current) return
            e.preventDefault()
            document.getElementById(`campo-${focarId.current}`)?.focus()
            focarId.current = null
          }}
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-[70] w-60 overflow-hidden rounded-xl border border-slate-700/80 bg-navy-800 p-1 shadow-lift data-[state=open]:animate-[pop-in_.14s_ease-out]"
        >
          {faltando.length > 0 && <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Campos padrão</div>}
          {faltando.map((c) => (
            <button key={c.id} type="button" onClick={() => add({ ...c, valor: 0 })} className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-navy-700/70">
              {c.label}
            </button>
          ))}
          {faltando.length > 0 && <div className="my-1 h-px bg-slate-700/70" />}
          <button
            type="button"
            onClick={() => add({ id: `custom_${Date.now()}`, label: '', tipo: 'moeda', valor: 0, custom: true })}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-blue-500 hover:bg-navy-700/70"
          >
            <Plus className="size-4" strokeWidth={2.5} /> Campo personalizado
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function FreteForm({ inicial, fretes, onCancel, onSaved }) {
  const { user } = useAuth()
  const { confirm } = useDialog()
  const showToast = useToast()
  const [form, setForm] = useState(() => ({ ...novaFicha(), ...inicial, campos: (inicial?.campos || novaFicha().campos).map((c) => ({ ...c })) }))
  const [saving, setSaving] = useState(false)
  const [erroNome, setErroNome] = useState(false)

  const setCampo = (id, patch) => setForm((f) => ({ ...f, campos: f.campos.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
  const removerCampo = (id) => setForm((f) => ({ ...f, campos: f.campos.filter((c) => c.id !== id) }))

  const salvar = async (e) => {
    e.preventDefault()
    const cliente = form.cliente.trim()
    if (!cliente) {
      setErroNome(true)
      return
    }
    const duplicado = fretes.some((f) => f.id !== inicial?.id && (f.cliente || '').trim().toLowerCase() === cliente.toLowerCase())
    if (duplicado && !(await confirm({ title: 'Cliente já cadastrado', message: `Já existe uma ficha de frete para "${cliente}". Deseja salvar mesmo assim?`, confirmLabel: 'Salvar mesmo assim' }))) return

    const data = {
      cliente,
      campos: form.campos.map((c) => ({ ...c, label: c.label.trim() || 'Campo sem nome' })),
      respSeguro: form.respSeguro,
      observacoes: form.observacoes.trim(),
    }
    setSaving(true)
    try {
      let id = inicial?.id
      if (id) await atualizarFrete(id, data, user.email)
      else id = (await criarFrete(data, user.email)).id
      showToast(`Frete de "${cliente}" salvo.`)
      onSaved(id)
    } catch (err) {
      console.error('Erro ao salvar frete:', err)
      showToast(err.code === 'permission-denied' ? 'Sem permissão: atualize as regras do Firestore (coleção fretes).' : 'Erro ao salvar o frete.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={salvar} className="flex min-h-0 flex-1 flex-col">
      <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-7">
        <div>
          <label className="label">Cliente</label>
          <input
            data-autofocus={!inicial?.id || undefined}
            value={form.cliente}
            maxLength={150}
            onChange={(e) => (setForm((f) => ({ ...f, cliente: e.target.value })), setErroNome(false))}
            placeholder="Nome do cliente"
            className={`field text-base font-semibold ${erroNome ? 'border-red-400/60' : ''}`}
          />
          {erroNome && <p className="mt-1.5 text-xs text-red-400">Informe o nome do cliente.</p>}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-[13px] font-semibold text-ink">Valores do frete</h3>
            <AdicionarCampo campos={form.campos} onAdd={(c) => setForm((f) => ({ ...f, campos: [...f.campos, c] }))} />
          </div>
          {form.campos.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-600/70 p-6 text-center text-sm text-slate-500">Nenhum campo. Use "Adicionar campo".</p>
          ) : (
            <div className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
              <AnimatePresence initial={false}>
                {form.campos.map((c) => (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.12 } }}
                    className="flex items-center gap-2"
                  >
                    {c.custom ? (
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <input
                          id={`campo-${c.id}`}
                          value={c.label}
                          maxLength={60}
                          onChange={(e) => setCampo(c.id, { label: e.target.value })}
                          placeholder="Nome do campo"
                          className="field field-sm"
                        />
                        <Segmented size="sm" className="p-0.5!" options={TIPO_OPCOES} value={c.tipo} onChange={(tipo) => setCampo(c.id, { tipo })} />
                      </div>
                    ) : (
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-300">{c.label}</span>
                    )}
                    <NumberInput
                      aria-label={c.label || 'Valor'}
                      value={c.valor}
                      decimals={TIPOS_CAMPO[c.tipo]?.casas ?? 2}
                      onChange={(valor) => setCampo(c.id, { valor })}
                      className="w-36 shrink-0"
                    />
                    <IconButton icon={X} size="sm" label={`Remover ${c.label || 'campo'}`} className="hover:text-red-400! hover:bg-red-400/10!" onClick={() => removerCampo(c.id)} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div>
          <label className="label">Responsável pelo seguro</label>
          <Segmented size="sm" className="max-w-sm" options={RESP_SEGURO} value={form.respSeguro} onChange={(respSeguro) => setForm((f) => ({ ...f, respSeguro }))} />
        </div>

        <div>
          <label className="label">Observações e peculiaridades</label>
          <textarea
            rows={4}
            maxLength={2000}
            value={form.observacoes}
            onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
            placeholder="Ex: cobra pedágio só na ida; escolta obrigatória para carga IMO; pagamento em 30 dias…"
            className="field resize-none"
          />
        </div>
      </div>
      <footer className="flex shrink-0 justify-end gap-2 border-t border-slate-700/70 px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:px-7">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={saving}>Salvar frete</Button>
      </footer>
    </form>
  )
}

function FreteView({ frete, onEdit, onDelete }) {
  const campos = frete.campos || []
  const resp = RESP_SEGURO.find((r) => r.value === frete.respSeguro)?.label || '—'
  return (
    <>
      <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-7">
        {campos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-600/70 p-6 text-center text-sm text-slate-500">Nenhum valor cadastrado.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {campos.map((c) => (
              <div key={c.id} className={`rounded-xl border border-slate-700/60 px-3.5 py-3 ${c.valor ? 'bg-navy-800' : 'bg-navy-900/40'}`}>
                <div className="truncate text-xs font-medium text-slate-500">{c.label}</div>
                <div className={`mt-1 text-lg font-semibold tabular-nums tracking-tight ${c.valor ? 'text-ink' : 'text-slate-500'}`}>{formatarValor(c.valor, c.tipo)}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <ShieldCheck className="size-4 text-slate-500" />
          <span className="text-slate-500">Resp. seguro:</span>
          <span className="font-semibold text-ink">{resp}</span>
        </div>

        {frete.observacoes && (
          <div>
            <h3 className="label">Observações e peculiaridades</h3>
            <p className="whitespace-pre-wrap rounded-xl border border-slate-700/60 bg-navy-900/40 p-3.5 text-sm leading-relaxed text-slate-300">{frete.observacoes}</p>
          </div>
        )}

        {frete.updatedAt && (
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <History className="size-3.5" />
            Atualizado em {formatarDataHora(frete.updatedAt)}{frete.updatedBy ? ` por ${frete.updatedBy}` : ''}
          </p>
        )}
      </div>
      <footer className="flex shrink-0 items-center gap-2 border-t border-slate-700/70 px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:px-7">
        <Button variant="danger" icon={Trash2} onClick={onDelete}>
          <span className="hidden sm:inline">Excluir</span>
        </Button>
        <Button className="ml-auto" icon={Pencil} onClick={onEdit}>Editar valores</Button>
      </footer>
    </>
  )
}

// FICHA DE FRETE DE UM CLIENTE: consulta (padrão) e edição. `frete` null = novo.
export default function FreteModal({ frete, fretes, onClose, onSaved }) {
  const { confirm } = useDialog()
  const showToast = useToast()
  const [editando, setEditando] = useState(!frete)

  const excluir = async () => {
    const ok = await confirm({
      title: `Excluir frete de "${frete.cliente}"?`,
      message: 'A ficha e todos os valores deste cliente serão apagados para toda a equipe. Essa ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      danger: true,
    })
    if (!ok) return
    await excluirFrete(frete.id)
    onClose()
    showToast('Ficha de frete excluída.')
  }

  return (
    <Modal onClose={onClose} title={frete ? `Frete — ${frete.cliente}` : 'Novo frete'} size="lg" fullscreenMobile>
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-700/70 px-5 py-4 sm:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-500">
            <Building2 className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{editando ? (frete ? 'Editando frete' : 'Novo frete') : 'Tabela de frete'}</div>
            <h2 className="truncate text-xl font-bold tracking-tight text-ink">{frete?.cliente || 'Novo cliente'}</h2>
          </div>
        </div>
        <IconButton icon={X} label="Fechar" shortcut="Esc" onClick={onClose} />
      </header>
      {editando ? (
        <FreteForm
          inicial={frete}
          fretes={fretes}
          onCancel={() => (frete ? setEditando(false) : onClose())}
          onSaved={(id) => {
            setEditando(false)
            onSaved(id)
          }}
        />
      ) : (
        <FreteView frete={frete} onEdit={() => setEditando(true)} onDelete={excluir} />
      )}
    </Modal>
  )
}
