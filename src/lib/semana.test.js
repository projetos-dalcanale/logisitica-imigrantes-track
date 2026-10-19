import { describe, expect, it } from 'vitest'
import { compromissosPorDia } from './semana'
import { novoChecklistImport } from './processos'

// Sexta-feira, 2 out 2026, 10:00 (horário local).
const NOW = new Date(2026, 9, 2, 10, 0).getTime()
const pad = (n) => String(n).padStart(2, '0')
// "YYYY-MM-DDTHH:MM" a `dias` de hoje (relativo ao NOW).
const em = (dias, h = 14, base = NOW) => {
  const d = new Date(base)
  d.setDate(d.getDate() + dias)
  d.setHours(h, 0, 0, 0)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`
}

const imp = (checklist, extra = {}) => ({
  id: `i${Math.random()}`, type: 'import', status: 'active',
  containers: [{ id: 'c1', numero: 'MSCU 123.456-6', checklist: { ...novoChecklistImport(), ...checklist } }],
  ...extra,
})
const exp = (container, extra = {}) => ({
  id: `e${Math.random()}`, type: 'export', status: 'active', containers: [{ id: 'c2', numero: 'MAEU 765.432-1', ...container }], ...extra,
})

describe('compromissos por dia', () => {
  it('devolve 7 dias a partir de hoje, com o rótulo "seg 05/10"', () => {
    const dias = compromissosPorDia([], NOW)
    expect(dias.map((d) => d.rotulo)).toEqual(['sex 02/10', 'sáb 03/10', 'dom 04/10', 'seg 05/10', 'ter 06/10', 'qua 07/10', 'qui 08/10'])
    expect(dias.map((d) => d.hoje)).toEqual([true, false, false, false, false, false, false])
    expect(dias.every((d) => d.total === 0 && d.itens.length === 0)).toBe(true)
  })

  it('conta o que falta fazer hoje, mas não o que já passou da hora (é atrasado)', () => {
    const dias = compromissosPorDia([imp({ ag_carga: em(0, 8) }), imp({ ag_carga: em(0, 14) })], NOW)
    expect(dias[0].total).toBe(1)
  })

  it('não conta o que já foi feito nem processo arquivado', () => {
    const feito = imp({ ag_carga: em(1), ag_carga_check: 'true' })
    const arquivado = imp({ ag_carga: em(1) }, { status: 'archived' })
    expect(compromissosPorDia([feito, arquivado], NOW)[1].total).toBe(0)
  })

  it('separa importação e exportação no mesmo dia', () => {
    const dias = compromissosPorDia([imp({ ag_carga: em(1) }), exp({ agVazio: em(1, 8) })], NOW)
    expect(dias[1]).toMatchObject({ importacao: 1, exportacao: 1, total: 2 })
    expect(dias[1].itens.map((i) => i.rotulo).sort()).toEqual(['Carregamento', 'Retirada do vazio'].sort())
    expect(dias[1].itens.every((i) => i.proc)).toBe(true)
  })

  it('cruza a virada do mês', () => {
    const agora = new Date(2026, 9, 30, 10, 0).getTime()
    const dias = compromissosPorDia([imp({ ag_carga: em(2, 9, agora) })], agora)
    expect(dias.map((d) => d.rotulo).slice(0, 3)).toEqual(['sex 30/10', 'sáb 31/10', 'dom 01/11'])
    expect(dias[2].total).toBe(1)
  })

  it('o oitavo dia fica de fora', () => {
    const dias = compromissosPorDia([imp({ ag_carga: em(7) })], NOW)
    expect(dias.reduce((s, d) => s + d.total, 0)).toBe(0)
  })

  it('aceita outra quantidade de dias', () => {
    expect(compromissosPorDia([], NOW, 3)).toHaveLength(3)
  })
})
