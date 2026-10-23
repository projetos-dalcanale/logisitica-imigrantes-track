import { useState } from 'react'
import { motion } from 'motion/react'
import { useToast } from '../../contexts/ToastContext'
import { useDialog } from '../../contexts/DialogContext'
import {
  chaveEtapa,
  draftAlertConfig,
  ehCargaSolta,
  formatarDataHora,
  getDraftDeadlineInfo,
  mascaraNumeroContainer,
  stepsChecklistImport,
  validarNumeroContainer,
  vazioDepoisDoDraft,
} from '../../lib/processos'
import {
  atualizarCampoContainer,
  atualizarChecklist,
  atualizarProcesso,
  numeroContainerDuplicado,
  removerContainer,
} from '../../lib/processActions'
import { etapaFeita, quandoRelativo } from '../../lib/etapas'
import { resumoContainer } from '../../lib/ficha'
import AutoSaveInput from '../AutoSaveInput'
import RegistrySelect from '../RegistrySelect'
import Checkbox from '../ui/Checkbox'
import DateTimeField from '../ui/DateTimeField'
import { Row } from '../ui/List'
import { Timeline, TimelineItem } from '../ui/Timeline'
import AgendamentosRows from './AgendamentosRows'
import ExportTimeline from './ExportTimeline'
import SecaoFicha from './SecaoFicha'
import { plainRight } from './comum'

export default function ContainerGroup({ proc, ct, index, processes, disabled, multi, now }) {
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
  const solta = ehCargaSolta(proc)
  const steps = isImport ? stepsChecklistImport(proc) : []
  const feitos = steps.filter((s) => etapaFeita(ct, s)).length

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
      <SecaoFicha
        id={`conteiner-${ct.id}`}
        kind="conteiner"
        titulo={solta ? 'Carga solta' : `Contêiner ${index + 1}${ct.tipo ? ` · ${ct.tipo}` : ''}`}
        resumo={resumoContainer(proc, ct, index)}
        acao={!disabled && !solta && <button type="button" className="text-[13px] text-red-500 hover:opacity-80" onClick={remover}>Remover</button>}
        footer={isImport ? `${feitos} de ${steps.length} etapas concluídas` : undefined}
      >
        {solta ? (
          // Carga solta: a descrição fica no processo (uma carga só), no lugar de número e tipo.
          <Row label="Descrição">
            <AutoSaveInput type="text" placeholder="Ex.: 104 caixas" maxLength={150} value={proc.carga} disabled={disabled} onSave={(v) => atualizarProcesso(proc.id, { carga: v })} className={plainRight} />
          </Row>
        ) : (
        <>
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
        </>
        )}
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

        {isImport && multi && <AgendamentosRows proc={proc} ct={ct} disabled={disabled} porContainer />}

        {isImport ? (
          <Timeline>
            {steps.map((step, i) => {
              // Só o check: as datas de agendamento ficam em "Agendamentos".
              const chave = chaveEtapa(step)
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
                  alvo={`etapa-${ct.id}-${step.id}`}
                  node={<Checkbox id={`etapa-${ct.id}-${step.id}`} tone="success" checked={feito} disabled={disabled} label={step.label} onChange={(v) => atualizarChecklist(proc, ct.id, chave, v)} />}
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
      </SecaoFicha>
    </motion.div>
  )
}
