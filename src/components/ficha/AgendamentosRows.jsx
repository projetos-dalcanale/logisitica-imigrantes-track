import { atualizarCampoContainer, atualizarChecklist } from '../../lib/processActions'
import RegistrySelect from '../RegistrySelect'
import DateTimeField from '../ui/DateTimeField'
import { Row } from '../ui/List'

// Agendamentos da importação (informativos): datas de carregamento e de
// devolução do vazio, guardadas no contêiner. Sem devolução na baixa. Com
// `porContainer` (2+ contêineres) também o terminal de devolução do contêiner;
// sem o dele vale o do processo (mostrado como sugestão).
export default function AgendamentosRows({ proc, ct, disabled, porContainer = false }) {
  const salvar = (campo) => (v) => atualizarChecklist(proc, ct.id, campo, v)
  return (
    <>
      <Row label="Agendamento de carregamento">
        <DateTimeField variant="pill" placeholder="Definir" value={ct.checklist?.ag_carga} disabled={disabled} onChange={salvar('ag_carga')} />
      </Row>
      {proc.finalizacaoVazio !== 'baixa' && (
        <>
          <Row label="Agendamento de vazio">
            <DateTimeField variant="pill" placeholder="Definir" value={ct.checklist?.ag_vazio} disabled={disabled} onChange={salvar('ag_vazio')} />
          </Row>
          {porContainer && (
            <Row label="Terminal de devolução">
              <RegistrySelect
                variant="plain"
                cat="vazio"
                value={ct.termVazio}
                disabled={disabled}
                placeholder={proc.termVazio || 'Terminal'}
                onChange={(v) => atualizarCampoContainer(proc, ct.id, 'termVazio', v)}
              />
            </Row>
          )}
        </>
      )}
    </>
  )
}
