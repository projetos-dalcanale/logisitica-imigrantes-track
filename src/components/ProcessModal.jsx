import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Archive, ArchiveRestore, ArrowDownToLine, ArrowUpFromLine, FileText, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { useDialog } from '../contexts/DialogContext'
import {
  draftAlertConfig,
  getDraftDeadlineInfo,
  mascaraNumeroContainer,
  stepsChecklistImport,
  validarNumeroContainer,
} from '../lib/processos'
import {
  adicionarContainer,
  atualizarCampoContainer,
  atualizarChecklist,
  atualizarProcesso,
  excluirProcesso,
  numeroContainerDuplicado,
  removerContainer,
} from '../lib/processActions'
import { exportarProcessoPDF } from '../lib/exportar'
import AutoSaveInput from './AutoSaveInput'
import RegistrySelect from './RegistrySelect'
import SaveIndicator from './SaveIndicator'
import { DraftIcon } from './ProcessCard'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Checkbox from './ui/Checkbox'
import DateTimeField from './ui/DateTimeField'
import Segmented from './ui/Segmented'
import Tooltip, { IconButton } from './ui/Tooltip'

export const DOC_TIPOS = [
  { value: 'DI', label: 'DI' },
  { value: 'DTA', label: 'DTA' },
  { value: 'DUIMP', label: 'DUIMP' },
]
export const DESTINOS = [
  { value: 'devolucao', label: 'Devolução de vazio' },
  { value: 'baixa', label: 'Baixa' },
]

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

function Section({ title, action, children }) {
  return (
    <section className="mb-7">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

// Edição dos dados do cabeçalho: Documento/Armador/Terminais/Destino na
// importação; Booking/Ref/Navio/Armador na exportação.
function HeaderEdit({ proc, onDone }) {
  const isImport = proc.type === 'import'
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(() =>
    isImport
      ? {
          documentoTipo: proc.documentoTipo || '',
          documentoNumero: proc.documentoNumero || '',
          armador: proc.armador || '',
          termCarga: proc.termCarga || '',
          termVazio: proc.termVazio || '',
          finalizacaoVazio: proc.finalizacaoVazio === 'baixa' ? 'baixa' : 'devolucao',
        }
      : { booking: proc.booking || '', referencia: proc.referencia || '', navio: proc.navio || '', armador: proc.armador || '' }
  )
  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))
  const bind = (field) => ({ value: form[field], onChange: (e) => set(field)(e.target.value), maxLength: 150, className: 'field' })

  const save = async () => {
    setSaving(true)
    try {
      await atualizarProcesso(proc.id, form)
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
      <div className="mt-4 rounded-2xl border border-slate-700/70 bg-navy-900/50 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {isImport ? (
            <>
              <Field label="Tipo de documento">
                <Segmented size="sm" options={DOC_TIPOS} value={form.documentoTipo} onChange={set('documentoTipo')} />
              </Field>
              <Field label="Número do documento"><input {...bind('documentoNumero')} /></Field>
              <Field label="Armador"><RegistrySelect cat="armador" value={form.armador} onChange={set('armador')} /></Field>
              <Field label="Destino do contêiner">
                <Segmented size="sm" options={DESTINOS} value={form.finalizacaoVazio} onChange={set('finalizacaoVazio')} />
              </Field>
              <Field label="Terminal de carregamento"><RegistrySelect cat="cheio" value={form.termCarga} onChange={set('termCarga')} /></Field>
              <Field label="Terminal de vazio"><RegistrySelect cat="vazio" value={form.termVazio} onChange={set('termVazio')} /></Field>
            </>
          ) : (
            <>
              <Field label="Booking"><input {...bind('booking')} /></Field>
              <Field label="Referência"><input {...bind('referencia')} /></Field>
              <Field label="Navio"><input {...bind('navio')} /></Field>
              <Field label="Armador"><RegistrySelect cat="armador" value={form.armador} onChange={set('armador')} /></Field>
            </>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onDone}>Cancelar</Button>
          <Button size="sm" loading={saving} onClick={save}>Salvar alterações</Button>
        </div>
      </div>
    </motion.div>
  )
}

function ImportChecklist({ proc, ct, disabled }) {
  const steps = stepsChecklistImport(proc)
  const feitos = steps.filter((s) => ct.checklist?.[s.type === 'checkbox' ? s.id : `${s.id}_check`] === 'true').length
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="label mb-0">Checklist</span>
        <span className="text-xs font-medium tabular-nums text-slate-500">{feitos} de {steps.length} etapas</span>
      </div>
      <div className="divide-y divide-slate-700/50 overflow-hidden rounded-xl border border-slate-700/60 bg-navy-800">
        {steps.map((step) => {
          const val = ct.checklist?.[step.id] || ''
          if (step.type === 'checkbox') {
            const isChecked = val === 'true'
            return (
              <label
                key={step.id}
                className={`flex min-h-12 cursor-pointer items-center gap-3 px-3.5 py-2.5 text-sm transition-colors ${disabled ? 'cursor-default' : 'hover:bg-navy-700/40'} ${isChecked ? 'bg-blue-600/[0.04]' : ''}`}
              >
                <Checkbox checked={isChecked} disabled={disabled} label={step.label} onChange={(v) => atualizarChecklist(proc, ct.id, step.id, v)} />
                <span className={`transition-colors ${isChecked ? 'text-slate-500 line-through decoration-slate-500/50' : 'text-ink'}`}>{step.label}</span>
              </label>
            )
          }
          const isAgendado = ct.checklist?.[`${step.id}_check`] === 'true'
          return (
            <div key={step.id} className={`flex flex-wrap items-center gap-x-3 gap-y-2 px-3.5 py-2.5 text-sm ${isAgendado ? 'bg-emerald-600/[0.05]' : ''}`}>
              <Tooltip label={isAgendado ? 'Agendado — clique para desmarcar' : 'Marcar como agendado'}>
                <span>
                  <Checkbox tone="success" checked={isAgendado} disabled={disabled} label={`${step.label}: agendado`} onChange={(v) => atualizarChecklist(proc, ct.id, `${step.id}_check`, v)} />
                </span>
              </Tooltip>
              <span className="flex-1 font-medium text-ink">{step.label}</span>
              <div className="w-full sm:w-56">
                <DateTimeField size="sm" value={val} disabled={disabled} onChange={(v) => atualizarChecklist(proc, ct.id, step.id, v)} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ExportDeadlines({ proc, ct, disabled }) {
  const save = (field) => (v) => atualizarCampoContainer(proc, ct.id, field, v)
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Deadline Draft"><DateTimeField size="sm" value={ct.deadlineDraft} disabled={disabled} onChange={save('deadlineDraft')} /></Field>
      <Field label="Deadline Carga"><DateTimeField size="sm" value={ct.deadlineCarga} disabled={disabled} onChange={save('deadlineCarga')} /></Field>
      <div className="space-y-2 rounded-xl border border-slate-700/60 bg-navy-800 p-3">
        <span className="label">Retirada de vazio</span>
        <RegistrySelect size="sm" cat="vazio" value={ct.termVazioExp} disabled={disabled} onChange={save('termVazioExp')} />
        <DateTimeField size="sm" value={ct.agVazio} disabled={disabled} onChange={save('agVazio')} />
      </div>
      <div className="space-y-2 rounded-xl border border-slate-700/60 bg-navy-800 p-3">
        <span className="label">Depósito cheio</span>
        <RegistrySelect size="sm" cat="cheio" value={ct.termCheioExp} disabled={disabled} onChange={save('termCheioExp')} />
        <DateTimeField size="sm" value={ct.agCheio} disabled={disabled} onChange={save('agCheio')} />
      </div>
    </div>
  )
}

function ContainerBlock({ proc, ct, index, processes, disabled }) {
  const showToast = useToast()
  const { confirm } = useDialog()
  const [numeroDigitado, setNumeroDigitado] = useState(ct.numero || '')
  const [numeroSalvo, setNumeroSalvo] = useState(ct.numero)
  if (ct.numero !== numeroSalvo) {
    setNumeroSalvo(ct.numero)
    setNumeroDigitado(ct.numero || '')
  }
  const save = (field) => (v) => atualizarCampoContainer(proc, ct.id, field, v)
  const digitoInvalido = validarNumeroContainer(numeroDigitado) === false

  // Avisa (sem bloquear) se outro processo ativo já usa o número.
  const saveNumero = async (value) => {
    if (value && numeroContainerDuplicado(processes, value, { procId: proc.id, ctId: ct.id })) {
      const ok = await confirm({
        title: 'Contêiner já em uso',
        message: `Outro processo ativo já usa o número "${value}". Deseja salvar mesmo assim?`,
        confirmLabel: 'Salvar mesmo assim',
      })
      if (!ok) {
        setNumeroDigitado(ct.numero || '')
        return false
      }
    }
    await save('numero')(value)
  }

  const remover = async () => {
    const ok = await confirm({
      title: 'Remover contêiner?',
      message: `${ct.numero || `Contêiner ${index + 1}`} e todo o checklist dele serão removidos deste processo.`,
      confirmLabel: 'Remover',
      danger: true,
    })
    if (!ok) return
    await removerContainer(proc, ct.id)
    showToast('Contêiner removido.')
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="mb-4 rounded-2xl border border-slate-700/60 bg-navy-900/50 p-4 sm:p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-navy-700 text-xs font-bold tabular-nums text-slate-400">{index + 1}</span>
          <span className="font-mono text-sm font-semibold text-ink">{ct.numero || <span className="font-sans font-normal text-slate-500">Sem número</span>}</span>
          {ct.tipo && <span className="rounded-md bg-navy-700/70 px-1.5 py-0.5 text-[11px] font-semibold text-slate-400">{ct.tipo}</span>}
        </div>
        {!disabled && <IconButton icon={Trash2} size="sm" label="Remover contêiner" className="hover:text-red-400! hover:bg-red-400/10!" onClick={remover} />}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Numeração">
          <AutoSaveInput
            type="text"
            placeholder="ABCD 123.456-7"
            maxLength={15}
            value={ct.numero}
            transform={(v) => {
              const m = mascaraNumeroContainer(v)
              setNumeroDigitado(m)
              return m
            }}
            disabled={disabled}
            onSave={saveNumero}
            className={`field font-mono ${digitoInvalido ? 'border-red-400/60' : ''}`}
          />
          {digitoInvalido && <p className="mt-1.5 text-xs text-red-400">Dígito verificador não confere — confira a numeração.</p>}
        </Field>
        <Field label="Tipo / equipamento">
          <RegistrySelect cat="tipo" value={ct.tipo} disabled={disabled} onChange={save('tipo')} />
        </Field>
        {proc.type === 'export' && (
          <>
            <Field label="Tara"><AutoSaveInput type="text" placeholder="Tara" value={ct.tara} disabled={disabled} onSave={save('tara')} className="field" /></Field>
            <Field label="Lacre"><AutoSaveInput type="text" placeholder="Lacre" value={ct.lacre} disabled={disabled} onSave={save('lacre')} className="field" /></Field>
          </>
        )}
      </div>

      {proc.type === 'import' ? <ImportChecklist proc={proc} ct={ct} disabled={disabled} /> : <ExportDeadlines proc={proc} ct={ct} disabled={disabled} />}
    </motion.div>
  )
}

// MODAL DE DETALHES DO PROCESSO. Tudo salva sozinho no Firestore, e o modal
// acompanha em tempo real alterações feitas em outra aba/dispositivo.
export default function ProcessModal({ proc, processes, onClose }) {
  const showToast = useToast()
  const { confirm } = useDialog()
  const [editingHeader, setEditingHeader] = useState(false)
  const isImport = proc.type === 'import'
  const archived = proc.status === 'archived'
  const containers = proc.containers || []
  const draftInfo = getDraftDeadlineInfo(proc)
  const title = isImport ? proc.importador || 'Processo de importação' : proc.exportador || 'Processo de exportação'

  const chips = isImport
    ? [
        ...(proc.documentoTipo
          ? [{ label: proc.documentoTipo, value: proc.documentoNumero }]
          : proc.documento ? [{ label: 'Documento', value: proc.documento }] : []),
        { label: 'Armador', value: proc.armador },
        { label: 'Carga', value: proc.termCarga },
        { label: 'Vazio', value: proc.termVazio },
        { label: 'Destino', value: proc.finalizacaoVazio === 'baixa' ? 'Baixa' : 'Devolução de vazio' },
      ]
    : [
        { label: 'Booking', value: proc.booking },
        { label: 'Ref', value: proc.referencia },
        { label: 'Navio', value: proc.navio },
        { label: 'Armador', value: proc.armador },
      ]

  const setStatus = async (status) => {
    const arquivar = status === 'archived'
    const ok = await confirm({
      title: arquivar ? 'Arquivar processo?' : 'Desarquivar processo?',
      message: arquivar ? 'Ele sai da lista de ativos e fica disponível em Arquivados.' : 'Ele volta para a lista de processos ativos.',
      confirmLabel: arquivar ? 'Arquivar' : 'Desarquivar',
    })
    if (!ok) return
    await atualizarProcesso(proc.id, { status })
    onClose()
    showToast(arquivar ? 'Processo movido para Arquivados.' : 'Processo restaurado para Ativos.')
  }

  const excluir = async () => {
    const ok = await confirm({
      title: 'Excluir processo?',
      message: `"${title}" será excluído permanentemente, com todos os contêineres. Essa ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      danger: true,
    })
    if (!ok) return
    try {
      await excluirProcesso(proc.id)
      onClose()
      showToast('Processo excluído.')
    } catch (error) {
      console.error('Erro ao excluir:', error)
      showToast('Erro ao excluir processo. Verifique as regras de segurança do Firestore.', 'error')
    }
  }

  const saveProcField = (field) => (v) => atualizarProcesso(proc.id, { [field]: v })

  return (
    <Modal onClose={onClose} title={title} size="xl" fullscreenMobile>
      <header className="shrink-0 border-b border-slate-700/70 px-5 pb-4 pt-4 sm:px-7 sm:pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-blue-500">
                {isImport ? <ArrowDownToLine className="size-3.5" strokeWidth={2.5} /> : <ArrowUpFromLine className="size-3.5" strokeWidth={2.5} />}
                {isImport ? 'Importação' : 'Exportação'}
              </span>
              {archived && <span className="rounded-full bg-slate-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Arquivado</span>}
              <SaveIndicator />
            </div>
            <h2 className="truncate text-xl font-bold tracking-tight text-ink sm:text-2xl">{title}</h2>
          </div>
          <IconButton icon={X} label="Fechar" shortcut="Esc" onClick={onClose} />
        </div>

        <AnimatePresence initial={false} mode="wait">
          {editingHeader ? (
            <HeaderEdit key="edit" proc={proc} onDone={() => setEditingHeader(false)} />
          ) : (
            <motion.div key="chips" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 flex flex-wrap items-center gap-1.5">
              {chips.map(({ label, value }) => (
                <span key={label} className="inline-flex items-center gap-1 rounded-lg bg-navy-700/60 px-2 py-1 text-xs text-slate-300">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium">{value || '—'}</span>
                </span>
              ))}
              {!archived && (
                <Button variant="ghost" size="sm" icon={Pencil} className="h-7! px-2! text-xs" onClick={() => setEditingHeader(true)}>
                  Editar
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-6 sm:px-7">
        {draftInfo && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 flex items-center gap-3 rounded-xl border-l-4 p-3.5 ${draftAlertConfig[draftInfo.nivel].box}`}
          >
            <DraftIcon nivel={draftInfo.nivel} className={`size-5 ${draftAlertConfig[draftInfo.nivel].iconColor}`} />
            <p className={`text-sm font-semibold ${draftAlertConfig[draftInfo.nivel].text}`}>{draftInfo.texto}</p>
          </motion.div>
        )}

        <Section title="Motorista e veículo">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Motorista">
              <AutoSaveInput type="text" placeholder="Nome do motorista" maxLength={150} value={proc.motorista} disabled={archived} onSave={saveProcField('motorista')} className="field" />
            </Field>
            <Field label="Placas">
              <AutoSaveInput type="text" placeholder="Ex: ABC1D23 e XYZ9F87" maxLength={150} value={proc.placas} disabled={archived} onSave={saveProcField('placas')} className="field" />
            </Field>
          </div>
        </Section>

        <Section title="Observações">
          <AutoSaveInput
            as="textarea"
            placeholder="Recados rápidos para a equipe (ex: aguardando liberação da Receita)…"
            maxLength={1000}
            rows={3}
            value={proc.observacoes}
            disabled={archived}
            onSave={saveProcField('observacoes')}
            className="field resize-none"
          />
        </Section>

        <Section
          title={`Contêineres (${containers.length})`}
          action={!archived && <Button size="sm" variant="secondary" icon={Plus} onClick={() => adicionarContainer(proc)}>Adicionar</Button>}
        >
          {containers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-600/70 p-8 text-center text-sm text-slate-500">
              Nenhum contêiner neste processo ainda.
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {containers.map((ct, index) => (
                <ContainerBlock key={ct.id} proc={proc} ct={ct} index={index} processes={processes} disabled={archived} />
              ))}
            </AnimatePresence>
          )}
        </Section>
      </div>

      <footer className="flex shrink-0 items-center gap-2 border-t border-slate-700/70 bg-navy-800 px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:px-7">
        <Tooltip label="Excluir processo">
          <Button variant="danger" icon={Trash2} onClick={excluir} aria-label="Excluir processo">
            <span className="hidden sm:inline">Excluir</span>
          </Button>
        </Tooltip>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" icon={FileText} onClick={() => exportarProcessoPDF(proc)}>
            <span className="hidden sm:inline">Exportar</span> PDF
          </Button>
          {archived ? (
            <Button icon={ArchiveRestore} onClick={() => setStatus('active')}>Desarquivar</Button>
          ) : (
            <Button variant="success" icon={Archive} onClick={() => setStatus('archived')}>Arquivar</Button>
          )}
        </div>
      </footer>
    </Modal>
  )
}
