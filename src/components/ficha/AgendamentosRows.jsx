import { atualizarChecklist } from '../../lib/processActions'
import DateTimeField from '../ui/DateTimeField'
import { Row } from '../ui/List'

// Agendamentos da importação (informativos): datas de carregamento e de
// devolução do vazio, guardadas no contêiner. Sem devolução na baixa.
export default function AgendamentosRows({ proc, ct, disabled }) {
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
