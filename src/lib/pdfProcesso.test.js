import { describe, expect, it } from 'vitest'
import { etapasDoContainer, montarHtmlProcesso } from './pdfProcesso'

const imp = {
  type: 'import',
  status: 'active',
  importador: 'Agro <Sul>',
  documentoTipo: 'DTA',
  documentoNumero: '26/0012345',
  armador: 'MSC',
  motorista: 'João',
  placas: 'ABC1D23',
  containers: [
    {
      id: 'a',
      numero: 'OOCU 704.568-8',
      checklist: { ag_carga: '2026-10-03T14:00', ag_carga_check: 'true', ag_carga_check_em: '2026-10-03T14:20:00', gerar_cte: '' },
    },
  ],
}

describe('PDF do processo', () => {
  it('etapas da importação com horário de conclusão e agendamento', () => {
    const etapas = etapasDoContainer(imp, imp.containers[0])
    expect(etapas[0]).toMatchObject({ label: 'Carregamento concluído', feito: true, concluidoEm: '03/10/2026 14:20', agendado: '03/10/2026 14:00' })
    expect(etapas[1]).toMatchObject({ label: 'Gerar CTe', feito: false, agendado: '' })
    expect(etapas).toHaveLength(6)
  })

  it('baixa de contêiner não tem a devolução do vazio', () => {
    expect(etapasDoContainer({ ...imp, finalizacaoVazio: 'baixa' }, imp.containers[0])).toHaveLength(5)
  })

  it('exportação usa as três etapas, com terminal no nome', () => {
    const ct = { agVazio: '2026-10-01T09:00', agVazioCheck: 'true', termVazioExp: 'Depot Cubatão' }
    const etapas = etapasDoContainer({ type: 'export' }, ct)
    expect(etapas.map((e) => e.feito)).toEqual([true, false, false])
    expect(etapas[0].label).toBe('Retirada do vazio · Depot Cubatão')
  })

  it('monta a ficha com a marca, os dados e escapa o que foi digitado', () => {
    const html = montarHtmlProcesso(imp, new Date(2026, 9, 5, 9, 30))
    expect(html).toContain('Transportes Imigrantes')
    expect(html).toContain('Agro &lt;Sul&gt;')
    expect(html).not.toContain('Agro <Sul>')
    expect(html).toContain('Gerado em 05/10/2026 09:30')
    expect(html).toContain('1 de 6 etapas')
    expect(html).toContain('Concluído 03/10/2026 14:20')
  })

  it('exportação mostra tara, lacre e deadlines no contêiner', () => {
    const html = montarHtmlProcesso({ type: 'export', exportador: 'Café', booking: 'B1', containers: [{ numero: 'X', tara: '3800', lacre: 'L9' }] })
    expect(html).toContain('Booking')
    expect(html).toContain('L9')
    expect(html).toContain('Deadline Draft')
  })
})
