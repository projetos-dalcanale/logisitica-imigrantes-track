import { describe, expect, it } from 'vitest'
import { previaDoProcesso } from './previa'
import { novoChecklistImport } from './processos'

const NOW = new Date(2026, 9, 2, 10, 0).getTime()

const imp = (extra = {}, containers = [{ id: 'c1', numero: 'MSCU 123.456-6' }]) => ({
  id: 'i1', type: 'import', status: 'active', importador: 'Agro Vale', armador: 'MSC',
  motorista: 'João', placas: 'abc1d23',
  containers: containers.map((c) => ({ checklist: novoChecklistImport(), ...c })),
  ...extra,
})

describe('prévia do processo', () => {
  it('traz título, tipo, próxima ação e as etapas com contagem', () => {
    const p = imp({}, [{ id: 'c1', numero: 'A', checklist: { ...novoChecklistImport(), gerar_cte: 'true' } }, { id: 'c2', numero: 'B' }])
    const v = previaDoProcesso(p, NOW)
    expect(v).toMatchObject({ titulo: 'Agro Vale', tipo: 'import' })
    expect(v.acao.texto).toBe('Agendar carregamento')
    expect(v.etapas.find((e) => e.label === 'Gerar CTe')).toEqual({ label: 'Gerar CTe', feitos: 1, total: 2 })
  })

  it('processo sem nome usa "Sem nome"', () => {
    expect(previaDoProcesso(imp({ importador: '' }), NOW).titulo).toBe('Sem nome')
  })

  it('contêiner sem motorista próprio herda o do processo', () => {
    const v = previaDoProcesso(imp({}, [{ id: 'c1', numero: 'A', motorista: 'Ana' }, { id: 'c2', numero: 'B' }]), NOW)
    expect(v.containers.map((c) => [c.rotulo, c.motorista])).toEqual([['A', 'Ana'], ['B', 'João']])
  })

  it('mostra no máximo 6 contêineres e informa quantos ficaram de fora', () => {
    const cts = Array.from({ length: 9 }, (_, i) => ({ id: `c${i}`, numero: `N${i}` }))
    const v = previaDoProcesso(imp({}, cts), NOW)
    expect(v.containers).toHaveLength(6)
    expect(v.restantes).toBe(3)
  })

  it('observações: 160 caracteres passam inteiras, 161 são cortadas com reticências', () => {
    expect(previaDoProcesso(imp({ observacoes: 'x'.repeat(160) }), NOW).observacoes).toBe('x'.repeat(160))
    expect(previaDoProcesso(imp({ observacoes: 'x'.repeat(161) }), NOW).observacoes).toBe(`${'x'.repeat(160)}…`)
  })

  it('observações com quebras de linha viram uma linha só', () => {
    expect(previaDoProcesso(imp({ observacoes: 'a\n\n  b' }), NOW).observacoes).toBe('a b')
  })

  it('processo sem contêiner não quebra', () => {
    const v = previaDoProcesso({ id: 'x', type: 'export', status: 'active', containers: [] }, NOW)
    expect(v).toMatchObject({ titulo: 'Sem nome', containers: [], restantes: 0 })
  })
})

describe('prévia: ordem dos contêineres', () => {
  const com = (data) => ({ checklist: { ...novoChecklistImport(), ag_carga: data } })

  it('lista na ordem das datas e cada contêiner leva o seu motorista e as suas placas', () => {
    const p = imp({}, [
      { id: 'c1', numero: 'A', motorista: 'Ana', placas: 'AAA1A11', ...com('2026-10-05T10:00') },
      { id: 'c2', numero: 'B', motorista: 'Bia', placas: 'BBB2B22', ...com('2026-10-03T10:00') },
    ])
    const v = previaDoProcesso(p, NOW)
    expect(v.containers.map((c) => [c.rotulo, c.motorista, c.placas])).toEqual([
      ['B', 'Bia', 'BBB-2B22'],
      ['A', 'Ana', 'AAA-1A11'],
    ])
  })

  it('contêiner sem número usa a posição na ordem exibida', () => {
    const p = imp({}, [{ id: 'c1', ...com('2026-10-05T10:00') }, { id: 'c2', ...com('2026-10-03T10:00') }])
    expect(previaDoProcesso(p, NOW).containers.map((c) => c.rotulo)).toEqual(['Contêiner 1', 'Contêiner 2'])
  })
})
