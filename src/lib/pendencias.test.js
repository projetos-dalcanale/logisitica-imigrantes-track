import { describe, expect, it } from 'vitest'
import { agendaPendencias, diaLocal, novaPendencia, opcoesDeProcesso, quandoDia, rotuloProcesso, validarPendencia } from './pendencias'

// Quinta-feira, 22 out 2026, 10:00 (horário local).
const NOW = new Date(2026, 9, 22, 10, 0).getTime()

// Pendência de teste: `data` no formato AAAA-MM-DD.
const p = (data, extra = {}) => ({ id: `${data}-${Math.random()}`, titulo: 'Encerrar MDFE', data, feito: false, feitoEm: null, createdAt: '2026-10-20T08:00:00.000Z', ...extra })
const ids = (lista) => lista.map((x) => x.id)

describe('dia local', () => {
  it('usa o dia do fuso local, não o de UTC', () => {
    // 23:30 em São Paulo já é o dia seguinte em UTC: a pendência tem que cair no dia local.
    const tarde = new Date(2026, 9, 22, 23, 30).getTime()
    // Pré-condição: os testes rodam no fuso de São Paulo (vite.config.js, test.env.TZ). Em UTC este
    // horário ainda seria dia 22 e o teste não distinguiria "dia local" de "dia em UTC".
    expect(new Date(tarde).toISOString().slice(0, 10)).toBe('2026-10-23')
    expect(diaLocal(tarde)).toBe('2026-10-22')
    expect(diaLocal(new Date(2026, 0, 5, 0, 5).getTime())).toBe('2026-01-05')
  })

  it('nova pendência começa vazia, para hoje e sem vínculo', () => {
    expect(novaPendencia(NOW)).toEqual({
      titulo: '', data: '2026-10-22', feito: false, feitoEm: null, feitoPor: null, processoId: null, processoRotulo: null,
    })
  })
})

describe('validação', () => {
  it('título vazio, só com espaços ou com mais de 200 caracteres não vale', () => {
    expect(validarPendencia({ titulo: '', data: '2026-10-22' })).toEqual(expect.any(String))
    expect(validarPendencia({ titulo: '   ', data: '2026-10-22' })).toEqual(expect.any(String))
    const longo = validarPendencia({ titulo: 'x'.repeat(201), data: '2026-10-22' })
    expect(longo).toEqual(expect.any(String))
    expect(longo).not.toBe(validarPendencia({ titulo: '', data: '2026-10-22' }))
  })

  it('título de 200 caracteres e dia certo valem; título com espaços nas pontas é contado sem eles', () => {
    expect(validarPendencia({ titulo: 'x'.repeat(200), data: '2026-10-22' })).toBeNull()
    expect(validarPendencia({ titulo: ` ${'x'.repeat(200)} `, data: '2026-10-22' })).toBeNull()
  })

  it('dia vazio, em outro formato ou que não existe não vale', () => {
    for (const data of ['', '22/10/2026', '2026-13-40', '2026-02-30', undefined]) {
      expect(validarPendencia({ titulo: 'Ligar para o terminal', data })).toEqual(expect.any(String))
    }
  })
})

describe('agenda das pendências', () => {
  it('ontem é atrasada, hoje NÃO é atrasada, amanhã e depois de amanhã ficam em seus grupos', () => {
    const ontem = p('2026-10-21')
    const hoje = p('2026-10-22')
    const amanha = p('2026-10-23')
    const depois = p('2026-10-24')
    const a = agendaPendencias([depois, amanha, hoje, ontem], NOW)
    expect(ids(a.atrasadas)).toEqual([ontem.id])
    expect(ids(a.hoje)).toEqual([hoje.id])
    expect(ids(a.amanha)).toEqual([amanha.id])
    expect(ids(a.proximas)).toEqual([depois.id])
    expect(a.feitas).toEqual([])
  })

  it('pendência não feita de 40 dias atrás continua em Atrasadas', () => {
    const velha = p('2026-09-12')
    expect(ids(agendaPendencias([velha], NOW).atrasadas)).toEqual([velha.id])
  })

  it('feita recentemente vai só para "feitas", mesmo com data futura; feita há mais de 7 dias some', () => {
    const recente = p('2026-10-21', { feito: true, feitoEm: new Date(2026, 9, 20, 9, 0).toISOString() })
    const futuraFeita = p('2026-10-30', { feito: true, feitoEm: new Date(2026, 9, 22, 8, 0).toISOString() })
    const antiga = p('2026-10-01', { feito: true, feitoEm: new Date(2026, 9, 14, 9, 0).toISOString() })
    const a = agendaPendencias([recente, futuraFeita, antiga], NOW)
    expect(ids(a.feitas)).toEqual([futuraFeita.id, recente.id]) // da mais recente para a mais antiga
    expect([a.atrasadas, a.hoje, a.amanha, a.proximas].every((g) => g.length === 0)).toBe(true)
  })

  it('ordena por dia e, no empate, por quem foi criada primeiro', () => {
    const b = p('2026-10-25', { createdAt: '2026-10-21T10:00:00.000Z' })
    const a = p('2026-10-25', { createdAt: '2026-10-20T10:00:00.000Z' })
    const c = p('2026-10-24')
    expect(ids(agendaPendencias([b, a, c], NOW).proximas)).toEqual([c.id, a.id, b.id])
  })

  it('lista vazia devolve os cinco grupos vazios', () => {
    expect(agendaPendencias([], NOW)).toEqual({ atrasadas: [], hoje: [], amanha: [], proximas: [], feitas: [] })
  })

  it('na virada do dia a de hoje passa a atrasada', () => {
    const hoje = p('2026-10-22')
    const amanhaCedo = new Date(2026, 9, 23, 0, 5).getTime()
    expect(ids(agendaPendencias([hoje], amanhaCedo).atrasadas)).toEqual([hoje.id])
  })
})

describe('texto do dia', () => {
  it('fala hoje, amanhã, ontem, quantos dias atrás, o dia da semana e a data', () => {
    expect(quandoDia('2026-10-22', NOW)).toBe('hoje')
    expect(quandoDia('2026-10-23', NOW)).toBe('amanhã')
    expect(quandoDia('2026-10-21', NOW)).toBe('ontem')
    expect(quandoDia('2026-10-19', NOW)).toBe('há 3 dias')
    expect(quandoDia('2026-10-26', NOW)).toBe('seg 26/10')
    expect(quandoDia('2026-11-30', NOW)).toBe('30/11')
  })
})

describe('processo vinculado', () => {
  const imp = (extra = {}) => ({
    id: 'i1', type: 'import', status: 'active', importador: 'Agro Vale', documentoTipo: 'DTA', documentoNumero: '26/0001',
    containers: [{ id: 'c1', numero: 'MSCU 123.456-6' }], ...extra,
  })

  it('rótulo: cliente e documento; exportação usa o booking', () => {
    expect(rotuloProcesso(imp())).toBe('Agro Vale · DTA 26/0001')
    expect(rotuloProcesso({ id: 'e1', type: 'export', exportador: 'Café Sul', booking: 'B1', containers: [] })).toBe('Café Sul · Booking B1')
  })

  it('sem documento usa os contêineres; sem cliente começa com "Sem nome"', () => {
    expect(rotuloProcesso(imp({ documentoNumero: '', documentoTipo: '' }))).toBe('Agro Vale · MSCU 123.456-6')
    expect(rotuloProcesso(imp({ importador: '' }))).toBe('Sem nome · DTA 26/0001')
  })

  it('opções: só processos ativos, e rótulo repetido ganha (2), (3) mantendo os ids', () => {
    const lista = [imp({ id: 'a' }), imp({ id: 'b' }), imp({ id: 'c', status: 'archived' }), imp({ id: 'd', documentoNumero: '26/0002' }), imp({ id: 'e' })]
    expect(opcoesDeProcesso(lista)).toEqual([
      { id: 'a', rotulo: 'Agro Vale · DTA 26/0001' },
      { id: 'b', rotulo: 'Agro Vale · DTA 26/0001 (2)' },
      { id: 'd', rotulo: 'Agro Vale · DTA 26/0002' },
      { id: 'e', rotulo: 'Agro Vale · DTA 26/0001 (3)' },
    ])
  })
})
