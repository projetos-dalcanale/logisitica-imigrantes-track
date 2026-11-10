import { Check } from 'lucide-react'
import { etapaExportFeita, exportSteps, vazioDepoisDoDraft } from '../../lib/processos'
import { marcarEtapasExport } from '../../lib/processActions'
import { quandoRelativo } from '../../lib/etapas'
import RegistrySelect from '../RegistrySelect'
import Checkbox from '../ui/Checkbox'
import DateTimeField from '../ui/DateTimeField'
import { Timeline, TimelineItem } from '../ui/Timeline'

const documentos = exportSteps.filter((step) => step.chip)
// Uma linha por etapa, com os documentos juntos na posição do primeiro deles.
const linhas = exportSteps.filter((step) => !step.chip || step === documentos[0])

// CTe, CIOT e MDFE saem juntos: uma linha só, com um botão para cada um. O
// marcador da linha marca os três de uma vez.
function LinhaDocumentos({ proc, ct, disabled, atual, last }) {
  const feitos = documentos.filter((step) => etapaExportFeita(ct, step)).length
  const todos = feitos === documentos.length
  const ultimoEm = documentos.map((step) => ct[`${step.check}Em`]).filter(Boolean).sort().at(-1)
  const quando = quandoRelativo(ultimoEm)
  const contagem = `${feitos} de ${documentos.length}`
  let subtitle = null
  if (todos) subtitle = quando ? `Documentos gerados ${quando}` : 'Documentos gerados'
  else if (atual) subtitle = `Próxima etapa · ${contagem}`
  else if (feitos > 0) subtitle = contagem
  return (
    <TimelineItem
      done={todos}
      atual={atual}
      last={last}
      title="Documentos"
      subtitle={subtitle}
      subtitleClass={todos ? 'text-emerald-500' : 'text-slate-400'}
      node={<Checkbox id={`etapa-${ct.id}-documentos`} tone="success" checked={todos} disabled={disabled} label="Marcar CTe, CIOT e MDFE" onChange={(v) => marcarEtapasExport(proc, ct.id, documentos, v)} />}
    >
      <div className="flex flex-wrap justify-end gap-1.5">
        {documentos.map((step) => {
          const feito = etapaExportFeita(ct, step)
          const concluido = quandoRelativo(ct[`${step.check}Em`])
          return (
            <button
              key={step.id}
              type="button"
              role="checkbox"
              aria-checked={feito}
              aria-label={step.label}
              title={feito ? (concluido ? `${step.feito} ${concluido}` : step.feito) : step.label}
              disabled={disabled}
              onClick={() => marcarEtapasExport(proc, ct.id, [step], !feito)}
              className={`inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[14px] transition-colors disabled:opacity-60 ${feito ? 'bg-emerald-500/15 text-emerald-500' : 'bg-navy-700/70 text-slate-500 hover:bg-navy-700 hover:text-ink'}`}
            >
              {feito && <Check className="size-3.5" aria-hidden="true" />}
              {step.chip}
            </button>
          )
        })}
      </div>
    </TimelineItem>
  )
}

function LinhaEtapa({ step, proc, ct, disabled, save, salvarVazio, now, atual, last }) {
  const feito = etapaExportFeita(ct, step)
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
  } else if (atual) {
    subtitle = step.semData ? 'Próxima etapa' : 'Próxima etapa · definir data'
  }
  return (
    <TimelineItem
      done={feito}
      atual={atual}
      last={last}
      title={step.label}
      subtitle={subtitle}
      subtitleClass={subtitleClass}
      alvo={`etapa-${ct.id}-${step.id}`}
      node={<Checkbox id={`etapa-${ct.id}-${step.id}`} tone="success" checked={feito} disabled={disabled} label={`${step.label}: ${step.feito}`} onChange={(v) => marcarEtapasExport(proc, ct.id, [step], v)} />}
    >
      {!step.semData && (
        <div className="flex flex-col items-end gap-1">
          {step.terminal && <RegistrySelect variant="plain" cat={step.cat} value={ct[step.terminal]} disabled={disabled} onChange={save(step.terminal)} placeholder="Terminal" />}
          <DateTimeField variant="pill" placeholder="Agendar" value={data} disabled={disabled} onChange={step.id === 'agVazio' ? salvarVazio : save(step.id)} />
        </div>
      )}
    </TimelineItem>
  )
}

// Exportação como linha do tempo: retirada do vazio, estufagem, documentos,
// depósito do cheio e encerramento do MDFE. A data diz quando está agendado;
// o check diz que aconteceu.
export default function ExportTimeline({ proc, ct, disabled, save, salvarVazio, now }) {
  const proxima = exportSteps.find((step) => !etapaExportFeita(ct, step))
  return (
    <Timeline>
      {linhas.map((step, i) => {
        const last = i === linhas.length - 1
        return step.chip ? (
          <LinhaDocumentos key="documentos" proc={proc} ct={ct} disabled={disabled} atual={!!proxima?.chip} last={last} />
        ) : (
          <LinhaEtapa key={step.id} step={step} proc={proc} ct={ct} disabled={disabled} save={save} salvarVazio={salvarVazio} now={now} atual={step === proxima} last={last} />
        )
      })}
    </Timeline>
  )
}
