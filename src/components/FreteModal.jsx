import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import * as Popover from '@radix-ui/react-popover'
import { CircleMinus, CirclePlus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useDialog } from '../contexts/DialogContext'
import { useToast } from '../contexts/ToastContext'
import { CAMPOS_PADRAO, RESP_SEGURO, TIPOS_CAMPO, atualizarFrete, criarFrete, excluirFrete, formatarValor, novaFicha } from '../lib/fretes'
import { formatarDataHora } from '../lib/processos'
import Modal, { SheetHeader } from './ui/Modal'
import Button from './ui/Button'
import NumberInput from './ui/NumberInput'
import Segmented from './ui/Segmented'
import { Group, Row } from './ui/List'

const TIPO_OPCOES = Object.entries(TIPOS_CAMPO).map(([value, t]) => ({ value, label: t.label }))

function Iniciais({ nome, size = 'lg' }) {
  const dim = size === 'lg' ? 'size-16 text-xl' : 'size-9 text-[13px]'
  return (
    <span className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-slate-400 to-slate-500 font-semibold text-white`}>
      {(nome || '?').trim().slice(0, 2).toUpperCase()}
    </span>
  )
}

// Linha "Adicionar campo" (menu com os campos padrão removidos + campo personalizado).
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
        <button type="button" className="flex min-h-11 w-full items-center gap-3 px-4 text-left text-[15px] text-blue-500 transition-colors hover:bg-navy-700/40">
          <CirclePlus className="size-5 fill-emerald-500 text-white dark:text-navy-800" strokeWidth={2} />
          Adicionar campo
        </button>
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
          sideOffset={4}
          collisionPadding={12}
          className="z-[70] w-60 overflow-hidden rounded-xl bg-navy-800/95 p-1.5 shadow-lift ring-[0.5px] ring-black/10 backdrop-blur-xl data-[state=open]:animate-[pop-in_.14s_ease-out] dark:ring-white/10"
        >
          {faltando.length > 0 && <div className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold text-slate-500">Campos padrão</div>}
          {faltando.map((c) => (
            <button key={c.id} type="button" onClick={() => add({ ...c, valor: 0 })} className="flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-[13px] text-ink hover:bg-blue-500 hover:text-white">
              {c.label}
            </button>
          ))}
          {faltando.length > 0 && <div className="my-1 h-px bg-slate-700" />}
          <button
            type="button"
            onClick={() => add({ id: `custom_${Date.now()}`, label: '', tipo: 'moeda', valor: 0, custom: true })}
            className="flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-[13px] font-medium text-blue-500 hover:bg-blue-500 hover:text-white"
          >
            Campo personalizado…
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
      showToast(err.code === 'permission-denied' ? 'Sem permissão: atualize as regras do Firestore (coleção fretes).' : 'Não foi possível salvar o frete.', 'error')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={salvar} className="flex min-h-0 flex-1 flex-col">
      <SheetHeader
        title={inicial?.id ? 'Editar frete' : 'Novo cliente'}
        left={<Button variant="plain" className="px-1" onClick={onCancel}>Cancelar</Button>}
        right={<Button type="submit" variant="plain" className="px-1 font-semibold" loading={saving}>Salvar</Button>}
      />
      <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-4 pb-10 pt-2 sm:px-6">
        <Group footer={erroNome ? <span className="text-red-500">Informe o nome do cliente.</span> : undefined}>
          <Row label={<span className={erroNome ? 'text-red-500' : ''}>Cliente</span>} htmlFor="frete-cliente">
            <input
              id="frete-cliente"
              data-autofocus={!inicial?.id || undefined}
              value={form.cliente}
              maxLength={150}
              onChange={(e) => (setForm((f) => ({ ...f, cliente: e.target.value })), setErroNome(false))}
              placeholder="Nome do cliente"
              className="field-plain text-right font-medium"
            />
          </Row>
        </Group>

        <Group title="Valores do frete" footer="Toque em ⊖ para remover um campo que este cliente não tem.">
          <AnimatePresence initial={false}>
            {form.campos.map((c) => (
              <motion.div key={c.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="flex min-h-11 items-center gap-3 px-4 py-1.5">
                  <button type="button" aria-label={`Remover ${c.label || 'campo'}`} onClick={() => removerCampo(c.id)} className="shrink-0 transition-transform active:scale-90">
                    <CircleMinus className="size-5 fill-red-500 text-white dark:text-navy-800" strokeWidth={2} />
                  </button>
                  {c.custom ? (
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <input
                        id={`campo-${c.id}`}
                        value={c.label}
                        maxLength={60}
                        onChange={(e) => setCampo(c.id, { label: e.target.value })}
                        placeholder="Nome do campo"
                        className="field-plain min-w-28 flex-1"
                      />
                      <Segmented size="sm" className="w-40" options={TIPO_OPCOES} value={c.tipo} onChange={(tipo) => setCampo(c.id, { tipo })} />
                    </div>
                  ) : (
                    <span className="min-w-0 flex-1 truncate text-[15px] text-ink">{c.label}</span>
                  )}
                  <NumberInput
                    plain
                    aria-label={c.label || 'Valor'}
                    value={c.valor}
                    decimals={TIPOS_CAMPO[c.tipo]?.casas ?? 2}
                    onChange={(valor) => setCampo(c.id, { valor })}
                    className="w-32 shrink-0 text-slate-400 focus:text-ink"
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <AdicionarCampo campos={form.campos} onAdd={(c) => setForm((f) => ({ ...f, campos: [...f.campos, c] }))} />
        </Group>

        <Group>
          <Row label="Seguro">
            <Segmented size="sm" className="w-64" options={RESP_SEGURO} value={form.respSeguro} onChange={(respSeguro) => setForm((f) => ({ ...f, respSeguro }))} />
          </Row>
        </Group>

        <Group title="Observações e peculiaridades">
          <div className="px-4 py-3">
            <textarea
              rows={4}
              maxLength={2000}
              value={form.observacoes}
              onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
              placeholder="Ex: cobra pedágio só na ida; escolta obrigatória para carga IMO; pagamento em 30 dias…"
              className="field-plain resize-none"
            />
          </div>
        </Group>
      </div>
    </form>
  )
}

function FreteView({ frete, onClose, onEdit, onDelete }) {
  const campos = frete.campos || []
  const resp = RESP_SEGURO.find((r) => r.value === frete.respSeguro)?.label || '—'
  return (
    <>
      <SheetHeader
        title=""
        left={<Button variant="plain" className="px-1" onClick={onClose}>Fechar</Button>}
        right={<Button variant="plain" className="px-1 font-semibold" onClick={onEdit}>Editar</Button>}
      />
      <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-4 pb-10 sm:px-6">
        <div className="flex flex-col items-center pt-1 text-center">
          <Iniciais nome={frete.cliente} />
          <h2 className="mt-3 font-display text-[24px] font-bold tracking-[-0.025em] text-ink">{frete.cliente}</h2>
          {frete.updatedAt && (
            <p className="mt-0.5 text-[13px] text-slate-500">
              Atualizado em {formatarDataHora(frete.updatedAt)}{frete.updatedBy ? ` por ${frete.updatedBy.split('@')[0]}` : ''}
            </p>
          )}
        </div>

        <Group title="Valores do frete">
          {campos.length === 0 ? (
            <div className="px-4 py-3 text-[15px] text-slate-500">Nenhum valor cadastrado.</div>
          ) : (
            campos.map((c) => (
              <Row key={c.id} label={c.label}>
                <span className={`tabular-nums ${c.valor ? 'font-medium text-ink' : 'text-slate-500'}`}>{formatarValor(c.valor, c.tipo)}</span>
              </Row>
            ))
          )}
        </Group>

        <Group>
          <Row label="Responsável pelo seguro"><span className="text-slate-400">{resp}</span></Row>
        </Group>

        {frete.observacoes && (
          <Group title="Observações e peculiaridades">
            <p className="whitespace-pre-wrap px-4 py-3 text-[15px] leading-relaxed text-ink">{frete.observacoes}</p>
          </Group>
        )}

        <Group>
          <button type="button" onClick={onDelete} className="flex min-h-11 w-full items-center justify-center px-4 text-[15px] text-red-500 transition-colors hover:bg-red-500/5">
            Excluir cliente
          </button>
        </Group>
      </div>
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
    <Modal onClose={onClose} title={frete ? `Frete — ${frete.cliente}` : 'Novo cliente'} size="md" sheet grouped>
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
        <FreteView frete={frete} onClose={onClose} onEdit={() => setEditando(true)} onDelete={excluir} />
      )}
    </Modal>
  )
}
