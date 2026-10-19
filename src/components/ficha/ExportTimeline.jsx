import { exportSteps, vazioDepoisDoDraft } from '../../lib/processos'
import { marcarEtapaExport } from '../../lib/processActions'
import { quandoRelativo } from '../../lib/etapas'
import RegistrySelect from '../RegistrySelect'
import Checkbox from '../ui/Checkbox'
import DateTimeField from '../ui/DateTimeField'
import { Timeline, TimelineItem } from '../ui/Timeline'

// Exportação como linha do tempo: retirada do vazio, estufagem e depósito
// do cheio. A data diz quando está agendado; o check diz que aconteceu.
export default function ExportTimeline({ proc, ct, disabled, save, salvarVazio, now }) {
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
            alvo={`etapa-${ct.id}-${step.id}`}
            node={<Checkbox id={`etapa-${ct.id}-${step.id}`} tone="success" checked={feito} disabled={disabled} label={`${step.label}: ${step.feito.toLowerCase()}`} onChange={(v) => marcarEtapaExport(proc, ct.id, step, v)} />}
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
