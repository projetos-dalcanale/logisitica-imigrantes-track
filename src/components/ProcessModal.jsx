import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Archive, ArchiveRestore, CirclePlus, FileText, Mail } from 'lucide-react'
import { ExportIcon, ImportIcon } from './ui/icons'
import { useToast } from '../contexts/ToastContext'
import { useDialog } from '../contexts/DialogContext'
import {
  DESTINOS,
  DOC_TIPOS,
  draftAlertConfig,
  exportSteps,
  formatarDataHora,
  getDraftDeadlineInfo,
  getProcessProgress,
  mascaraNumeroContainer,
  stepsChecklistImport,
  validarNumeroContainer,
  vazioDepoisDoDraft,
} from '../lib/processos'
import {
  adicionarContainer,
  atualizarCampoContainer,
  atualizarChecklist,
  atualizarProcesso,
  excluirProcesso,
  marcarEtapaExport,
  numeroContainerDuplicado,
  removerContainer,
} from '../lib/processActions'
import { exportarProcessoPDF } from '../lib/exportar'
import { etapaFeita, quandoRelativo } from '../lib/etapas'
import AutoSaveInput from './AutoSaveInput'
import RegistrySelect from './RegistrySelect'
import SaveIndicator from './SaveIndicator'
import { DraftIcon } from './ProcessCard'
import Modal, { SheetHeader } from './ui/Modal'
import Button from './ui/Button'
import DeleteButton from './ui/DeleteButton'
import Checkbox from './ui/Checkbox'
import DateTimeField from './ui/DateTimeField'
import Segmented from './ui/Segmented'
import { Group, Row } from './ui/List'
import { Timeline, TimelineItem } from './ui/Timeline'

const plainRight = 'field-plain text-right'
const valor = (v) => (v ? <span className="truncate text-slate-400">{v}</span> : <span className="text-slate-500">—</span>)

// Dados principais do processo: leitura em linhas ou edição (Editar/Salvar).
function DetalhesGroup({ proc, archived }) {
  const isImport = proc.type === 'import'
  const [editando, setEditando] = useState(false)
  const [saving, setSaving] = useState(false)
  const inicial = () =>
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
  const [form, setForm] = useState(inicial)
  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))
  const input = (field, placeholder) => (
    <input value={form[field]} onChange={(e) => set(field)(e.target.value)} maxLength={150} placeholder={placeholder} className={plainRight} />
  )

  const salvar = async () => {
    setSaving(true)
    try {
      // Na baixa não há devolução, então o terminal de vazio é apagado.
      await atualizarProcesso(proc.id, form.finalizacaoVazio === 'baixa' ? { ...form, termVazio: '' } : form)
      setEditando(false)
    } finally {
      setSaving(false)
    }
  }

  const action = archived ? null : editando ? (
    <div className="flex gap-3">
      <button type="button" className="text-[13px] text-slate-400 hover:text-ink" onClick={() => (setForm(inicial()), setEditando(false))}>Cancelar</button>
      <button type="button" className="text-[13px] font-semibold text-blue-500 hover:text-blue-400 disabled:opacity-50" disabled={saving} onClick={salvar}>Salvar</button>
    </div>
  ) : (
    <button type="button" className="text-[13px] text-blue-500 hover:text-blue-400" onClick={() => (setForm(inicial()), setEditando(true))}>Editar</button>
  )

  if (!editando) {
    const docLabel = proc.documentoTipo || 'Documento'
    return (
      <Group title="Detalhes" action={action}>
        {isImport ? (
          <>
            <Row label={docLabel}>{valor(proc.documentoTipo ? proc.documentoNumero : proc.documento)}</Row>
            <Row label="Armador">{valor(proc.armador)}</Row>
            <Row label="Carregamento">{valor(proc.termCarga)}</Row>
            <Row label="Destino">{valor(proc.finalizacaoVazio === 'baixa' ? 'Baixa (sem devolução)' : 'Devolução de vazio')}</Row>
            {proc.finalizacaoVazio !== 'baixa' && <Row label="Vazio">{valor(proc.termVazio)}</Row>}
          </>
        ) : (
          <>
            <Row label="Booking">{valor(proc.booking)}</Row>
            <Row label="Referência">{valor(proc.referencia)}</Row>
            <Row label="Navio">{valor(proc.navio)}</Row>
            <Row label="Armador">{valor(proc.armador)}</Row>
          </>
        )}
      </Group>
    )
  }

  return (
    <Group title="Detalhes" action={action}>
      {isImport ? (
        <>
          <Row label="Documento"><Segmented size="sm" className="w-48" options={DOC_TIPOS} value={form.documentoTipo} onChange={set('documentoTipo')} /></Row>
          <Row label="Número">{input('documentoNumero', 'Nº do documento')}</Row>
          <Row label="Armador"><RegistrySelect variant="plain" cat="armador" value={form.armador} onChange={set('armador')} /></Row>
          <Row label="Carregamento"><RegistrySelect variant="plain" cat="cheio" value={form.termCarga} onChange={set('termCarga')} placeholder="Terminal" /></Row>
          <Row label="Destino"><Segmented size="sm" className="w-56" options={DESTINOS} value={form.finalizacaoVazio} onChange={set('finalizacaoVazio')} /></Row>
          {form.finalizacaoVazio !== 'baixa' && (
            <Row label="Vazio"><RegistrySelect variant="plain" cat="vazio" value={form.termVazio} onChange={set('termVazio')} placeholder="Terminal" /></Row>
          )}
        </>
      ) : (
        <>
          <Row label="Booking">{input('booking', 'Número')}</Row>
          <Row label="Referência">{input('referencia', 'Opcional')}</Row>
          <Row label="Navio">{input('navio', 'Nome do navio')}</Row>
          <Row label="Armador"><RegistrySelect variant="plain" cat="armador" value={form.armador} onChange={set('armador')} /></Row>
        </>
      )}
    </Group>
  )
}

// Exportação como linha do tempo: retirada do vazio, estufagem e depósito
// do cheio. A data diz quando está agendado; o check diz que aconteceu.
function ExportTimeline({ proc, ct, disabled, save, salvarVazio, now }) {
  const atual = exportSteps.findIndex((step) => ct[step.check] !== 'true')
  return (
    <Timeline>
      {exportSteps.map((step, i) => {
        const feito = ct[step.check] === 'true'
        const data = ct[step.id]
        const passou = data && !feito && new Date(data).getTime() < now
        const quando = quandoRelativo(ct[`${step.check}Em`])
        const depoisDoDraft = step.id === 'agVazio' && !feito && vazioDepoisDoDraft(data, ct.deadlineDraft)
        let subtitle = null
        let subtitleClass = 'text-slate-400'
        if (feito) {
          subtitle = quando ? `${step.feito} ${quando}` : step.feito
          subtitleClass = 'text-emerald-500'
        } else if (depoisDoDraft) {
          subtitle = `Depois do Deadline Draft (${quandoRelativo(ct.deadlineDraft, now)})`
          subtitleClass = 'text-yellow-500'
        } else if (passou) {
          subtitle = 'Horário passou · confirmar'
          subtitleClass = 'text-red-500'
        } else if (data) {
          subtitle = 'Agendado'
        } else if (i === atual) {
          subtitle = 'Próxima etapa · definir data'
        }
        return (
          <TimelineItem
            key={step.id}
            done={feito}
            atual={i === atual}
            last={i === exportSteps.length - 1}
            title={step.label}
            subtitle={subtitle}
            subtitleClass={subtitleClass}
            onClick={disabled ? undefined : () => marcarEtapaExport(proc, ct.id, step, !feito)}
            node={<Checkbox tone="success" checked={feito} disabled={disabled} label={`${step.label}: ${step.feito.toLowerCase()}`} onChange={(v) => marcarEtapaExport(proc, ct.id, step, v)} />}
          >
            <div className="flex flex-col items-end gap-1">
              {step.terminal && <RegistrySelect variant="plain" cat={step.cat} value={ct[step.terminal]} disabled={disabled} onChange={save(step.terminal)} placeholder="Terminal" />}
              <DateTimeField variant="pill" placeholder="Agendar" value={data} disabled={disabled} onChange={step.id === 'agVazio' ? salvarVazio : save(step.id)} />
            </div>
          </TimelineItem>
        )
      })}
    </Timeline>
  )
}

// Agendamentos da importação (informativos): datas de carregamento e de
// devolução do vazio, guardadas no contêiner. Sem devolução na baixa.
function AgendamentosRows({ proc, ct, disabled }) {
  const salvar = (campo) => (v) => atualizarChecklist(proc, ct.id, campo, v)
  return (
    <>
      <Row label="Agendamento de carregamento">
        <DateTimeField variant="pill" placeholder="Definir" value={ct.checklist?.ag_carga} disabled={disabled} onChange={salvar('ag_carga')} />
      </Row>
      {proc.finalizacaoVazio !== 'baixa' && (
        <Row label="Agendamento de vazio">
          <DateTimeField variant="pill" placeholder="Definir" value={ct.checklist?.ag_vazio} disabled={disabled} onChange={salvar('ag_vazio')} />
        </Row>
      )}
    </>
  )
}

function ContainerGroup({ proc, ct, index, processes, disabled, multi, now }) {
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
  const isImport = proc.type === 'import'
  const steps = isImport ? stepsChecklistImport(proc) : []
  const feitos = steps.filter((s) => ct.checklist?.[s.type === 'checkbox' ? s.id : `${s.id}_check`] === 'true').length

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

  // A retirada do vazio tem que ser antes do Deadline Draft: avisa (sem
  // bloquear) ao agendar depois dele, ou ao mudar o Draft para antes do vazio.
  const draftCt = isImport ? null : getDraftDeadlineInfo({ ...proc, containers: [ct] }, now)
  const salvarVazio = async (valor) => {
    if (vazioDepoisDoDraft(valor, ct.deadlineDraft)) {
      const ok = await confirm({
        title: 'Retirada depois do Deadline Draft',
        message: `O Deadline Draft deste contêiner é ${formatarDataHora(ct.deadlineDraft)}. A retirada do vazio precisa ser agendada antes dele. Agendar para ${formatarDataHora(valor)} mesmo assim?`,
        confirmLabel: 'Agendar',
      })
      if (!ok) return
    }
    await save('agVazio')(valor)
  }
  const salvarDraft = async (valor) => {
    if (ct.agVazioCheck !== 'true' && vazioDepoisDoDraft(ct.agVazio, valor)) {
      const ok = await confirm({
        title: 'Deadline Draft antes da retirada',
        message: `A retirada do vazio está agendada para ${formatarDataHora(ct.agVazio)}, depois deste Deadline Draft (${formatarDataHora(valor)}). Salvar mesmo assim?`,
        confirmLabel: 'Salvar',
      })
      if (!ok) return
    }
    await save('deadlineDraft')(valor)
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
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}>
      <Group
        title={`Contêiner ${index + 1}${ct.tipo ? ` · ${ct.tipo}` : ''}`}
        action={!disabled && <button type="button" className="text-[13px] text-red-500 hover:opacity-80" onClick={remover}>Remover</button>}
        footer={isImport ? `${feitos} de ${steps.length} etapas concluídas` : undefined}
      >
        <Row label="Numeração">
          <div className="min-w-0 flex-1">
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
              className={`${plainRight} font-mono text-[14px] ${digitoInvalido ? 'text-red-500' : ''}`}
            />
            {digitoInvalido && <p className="text-[11px] text-red-500">Dígito verificador não confere</p>}
          </div>
        </Row>
        <Row label="Tipo"><RegistrySelect variant="plain" cat="tipo" value={ct.tipo} disabled={disabled} onChange={save('tipo')} /></Row>
        {multi && (
          <>
            {/* Sem motorista próprio, o contêiner usa o do processo (aparece como sugestão). */}
            <Row label="Motorista">
              <AutoSaveInput type="text" placeholder={proc.motorista || 'Nome'} maxLength={150} value={ct.motorista} disabled={disabled} onSave={save('motorista')} className={plainRight} />
            </Row>
            <Row label="Placas">
              <AutoSaveInput type="text" placeholder={proc.placas || 'ABC1D23'} maxLength={150} value={ct.placas} disabled={disabled} onSave={save('placas')} className={plainRight} />
            </Row>
          </>
        )}

        {isImport && multi && <AgendamentosRows proc={proc} ct={ct} disabled={disabled} />}

        {isImport ? (
          <Timeline>
            {steps.map((step, i) => {
              // Só o check: as datas de agendamento ficam em "Agendamentos".
              const chave = step.type === 'checkbox' ? step.id : `${step.id}_check`
              const feito = etapaFeita(ct, step)
              const atual = !feito && i === steps.findIndex((s) => !etapaFeita(ct, s))
              const quando = quandoRelativo(ct.checklist?.[`${chave}_em`])
              return (
                <TimelineItem
                  key={step.id}
                  done={feito}
                  atual={atual}
                  last={i === steps.length - 1}
                  title={step.label}
                  subtitle={feito ? (quando ? `Concluído ${quando}` : 'Concluído') : atual && 'Próxima etapa'}
                  subtitleClass={feito ? 'text-emerald-500' : 'text-slate-400'}
                  onClick={disabled ? undefined : () => atualizarChecklist(proc, ct.id, chave, !feito)}
                  node={<Checkbox tone="success" checked={feito} disabled={disabled} label={step.label} onChange={(v) => atualizarChecklist(proc, ct.id, chave, v)} />}
                />
              )
            })}
          </Timeline>
        ) : (
          <>
            <Row label="Tara"><AutoSaveInput type="text" placeholder="—" value={ct.tara} disabled={disabled} onSave={save('tara')} className={plainRight} /></Row>
            <Row label="Lacre"><AutoSaveInput type="text" placeholder="—" value={ct.lacre} disabled={disabled} onSave={save('lacre')} className={plainRight} /></Row>
            {/* Prazos do armador: só informativos, não são etapas. */}
            <Row label={<span>Deadline Draft{draftCt && <span className={`block text-[12px] font-medium ${draftAlertConfig[draftCt.nivel].text}`}>{draftCt.texto}</span>}</span>}>
              <DateTimeField variant="pill" placeholder="Definir" value={ct.deadlineDraft} disabled={disabled} onChange={salvarDraft} />
            </Row>
            <Row label="Deadline Carga"><DateTimeField variant="pill" placeholder="Definir" value={ct.deadlineCarga} disabled={disabled} onChange={save('deadlineCarga')} /></Row>
            <ExportTimeline proc={proc} ct={ct} disabled={disabled} save={save} salvarVazio={salvarVazio} now={now} />
          </>
        )}
      </Group>
    </motion.div>
  )
}

// FICHA DO PROCESSO. Tudo salva sozinho no Firestore, e a ficha acompanha
// em tempo real alterações feitas em outra aba ou dispositivo.
export default function ProcessModal({ proc, processes, onClose, onEnviarStatus }) {
  const showToast = useToast()
  const { confirm } = useDialog()
  // Relógio da ficha: fixado ao abrir (as marcações de horário usam a hora real).
  const [now] = useState(() => Date.now())
  const isImport = proc.type === 'import'
  const archived = proc.status === 'archived'
  const containers = proc.containers || []
  const draftInfo = getDraftDeadlineInfo(proc)
  const progress = getProcessProgress(proc)
  const title = isImport ? proc.importador || 'Processo de importação' : proc.exportador || 'Processo de exportação'
  const saveProcField = (field) => (v) => atualizarProcesso(proc.id, { [field]: v })

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
    showToast(arquivar ? 'Processo arquivado.' : 'Processo restaurado para Ativos.')
  }

  // A confirmação acontece no próprio botão (lixeira → ✓/✕). Espera o check
  // aparecer antes de excluir, senão a ficha fecha antes da animação.
  const excluir = () => {
    setTimeout(async () => {
      try {
        await excluirProcesso(proc.id)
        onClose()
        showToast('Processo excluído.')
      } catch (error) {
        console.error('Erro ao excluir:', error)
        showToast('Não foi possível excluir. Verifique as regras de segurança do Firestore.', 'error')
      }
    }, 700)
  }

  return (
    <Modal onClose={onClose} title={title} size="lg" sheet grouped>
      <SheetHeader
        title=""
        left={<div className="pl-1"><SaveIndicator /></div>}
        right={<Button variant="plain" className="px-1 font-semibold" onClick={onClose}>OK</Button>}
      />

      <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-4 pb-8 sm:px-6">
        <div className="px-1">
          <div className="mb-1 flex items-center gap-1.5 text-[13px] font-medium text-slate-400">
            {isImport ? <ImportIcon className="size-3.5" strokeWidth={2.4} /> : <ExportIcon className="size-3.5" strokeWidth={2.4} />}
            {isImport ? 'Importação' : 'Exportação'}
            {archived && <span className="ml-1 rounded-full bg-slate-500/15 px-2 py-px text-[11px]">Arquivado</span>}
          </div>
          <h2 className="font-display text-[26px] font-bold leading-tight tracking-[-0.025em] text-ink">{title}</h2>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-500/15">
              <motion.div
                className={`h-full rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 22 }}
              />
            </div>
            <span className="text-xs font-medium tabular-nums text-slate-400">{progress}%</span>
          </div>
        </div>

        {draftInfo && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className={`flex items-center gap-3 rounded-xl px-4 py-3 ${draftAlertConfig[draftInfo.nivel].soft}`}>
            <DraftIcon nivel={draftInfo.nivel} className={`size-5 ${draftAlertConfig[draftInfo.nivel].iconColor}`} />
            <p className={`text-[15px] font-semibold ${draftAlertConfig[draftInfo.nivel].text}`}>{draftInfo.texto}</p>
          </motion.div>
        )}

        <DetalhesGroup key={archived ? 'a' : 'b'} proc={proc} archived={archived} />

        {/* Com mais de um contêiner, motorista e placas ficam em cada contêiner. */}
        {containers.length <= 1 && (
          <Group title="Transporte">
            <Row label="Motorista"><AutoSaveInput type="text" placeholder="Nome" maxLength={150} value={proc.motorista} disabled={archived} onSave={saveProcField('motorista')} className={plainRight} /></Row>
            <Row label="Placas"><AutoSaveInput type="text" placeholder="ABC1D23" maxLength={150} value={proc.placas} disabled={archived} onSave={saveProcField('placas')} className={plainRight} /></Row>
          </Group>
        )}

        {/* Com um contêiner, os agendamentos ficam aqui, como o transporte. */}
        {isImport && containers.length === 1 && (
          <Group title="Agendamentos">
            <AgendamentosRows proc={proc} ct={containers[0]} disabled={archived} />
          </Group>
        )}

        <Group title="Observações">
          <div className="px-4 py-3">
            <AutoSaveInput
              as="textarea"
              placeholder="Recados rápidos para a equipe (ex: aguardando liberação da Receita)…"
              maxLength={1000}
              rows={3}
              value={proc.observacoes}
              disabled={archived}
              onSave={saveProcField('observacoes')}
              className="field-plain resize-none"
            />
          </div>
        </Group>

        <AnimatePresence initial={false}>
          {containers.map((ct, index) => (
            <ContainerGroup key={ct.id} proc={proc} ct={ct} index={index} processes={processes} disabled={archived} multi={containers.length > 1} now={now} />
          ))}
        </AnimatePresence>

        {!archived && (
          <Group>
            <button
              type="button"
              onClick={() => adicionarContainer(proc)}
              className="flex min-h-11 w-full items-center gap-3 px-4 text-left text-[15px] text-blue-500 transition-colors hover:bg-navy-700/40"
            >
              <CirclePlus className="size-5 fill-emerald-500 text-white dark:text-navy-800" strokeWidth={2} />
              Adicionar contêiner
            </button>
          </Group>
        )}
        {archived && containers.length === 0 && <p className="px-4 text-sm text-slate-500">Nenhum contêiner neste processo.</p>}
      </div>

      <footer className="hairline-t flex shrink-0 items-center gap-2 bg-navy-900/80 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-6">
        <DeleteButton label="Excluir processo" onConfirm={excluir} />
        <div className="ml-auto flex gap-2">
          {!archived && onEnviarStatus && (
            <Button variant="gray" icon={Mail} onClick={() => onEnviarStatus(proc.id)}>Status</Button>
          )}
          <Button variant="gray" icon={FileText} onClick={() => exportarProcessoPDF(proc)}>PDF</Button>
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
