import { describe, expect, it } from 'vitest'
import { COLUNAS, linhaDaTabela, ordenarLinhas } from './tabela'
import { novoChecklistImport } from './processos'

// Sexta-feira, 2 out 2026, 10:00 (horário local).
const NOW = new Date(2026, 9, 2, 10, 0).getTime()

const imp = (extra = {}, containers = [{ id: 'c1', numero: 'MSCU 123.456-6' }]) => ({
  id: 'i1', type: 'import', status: 'active', importador: 'Agro Vale', armador: 'MSC',
  documentoTipo: 'DTA', documentoNumero: '26/0001', motorista: 'João', placas: 'abc1d23',
  containers: containers.map((c) => ({ checklist: novoChecklistImport(), ...c })),
  ...extra,
})

const linha = (id, campos = {}) => ({
  id, tipo: 'import', cliente: '', documento: '', conteiner: '', armador: '', transporte: '',
  etapasFeitas: 0, etapasTotal: 0, acao: { texto: '', tom: 'neutral' }, prazo: null, grupo: 'semData', ...campos,
})
const ids = (linhas) => linhas.map((l) => l.id)

describe('colunas da tabela', () => {
  it('lista as colunas na ordem da tela', () => {
    expect(COLUNAS.map((c) => c.id)).toEqual(['cliente', 'documento', 'conteiner', 'armador', 'transporte', 'etapas', 'acao', 'prazo'])
    expect(COLUNAS.every((c) => c.ordenavel && c.label)).toBe(true)
  })
})

describe('linha da tabela', () => {
  it('importação com 2 contêineres mostra o primeiro e "+1"', () => {
    const p = imp({}, [
      { id: 'c1', numero: 'MSCU 123.456-6', checklist: { ...novoChecklistImport(), gerar_cte: 'true' } },
      { id: 'c2', numero: 'TGHU 765.432-1' },
    ])
    const l = linhaDaTabela(p, NOW)
    expect(l).toMatchObject({ id: 'i1', tipo: 'import', cliente: 'Agro Vale', documento: 'DTA 26/0001', conteiner: 'MSCU 123.456-6 +1', armador: 'MSC', etapasFeitas: 1, etapasTotal: 12 })
    expect(l.transporte).toBe('João · ABC-1D23')
  })

  it('exportação usa o booking como documento', () => {
    const p = { id: 'e1', type: 'export', status: 'active', exportador: 'Café Sul', booking: 'BKG777', armador: 'Maersk', containers: [{ id: 'c1', numero: 'MAEU 765.432-1' }] }
    expect(linhaDaTabela(p, NOW)).toMatchObject({ tipo: 'export', cliente: 'Café Sul', documento: 'Booking BKG777', conteiner: 'MAEU 765.432-1', etapasTotal: 3 })
  })

  it('carga solta mostra a descrição da carga no lugar do contêiner', () => {
    const p = imp({ modalidade: 'solta', carga: '104 caixas' })
    expect(linhaDaTabela(p, NOW).conteiner).toBe('104 caixas')
  })

  it('processo sem contêiner, sem nome e sem datas não quebra', () => {
    const l = linhaDaTabela({ id: 'x', type: 'import', status: 'active', containers: [] }, NOW)
    expect(l).toMatchObject({ cliente: '', documento: '', conteiner: '', armador: '', transporte: '', etapasFeitas: 0, etapasTotal: 0, prazo: null })
    expect(l.acao.texto).toBe('Adicionar contêiner')
  })

  it('guarda o próximo prazo e o grupo de urgência', () => {
    const p = imp({}, [{ id: 'c1', numero: 'A', checklist: { ...novoChecklistImport(), ag_carga: '2026-10-02T14:00' } }])
    expect(linhaDaTabela(p, NOW)).toMatchObject({ prazo: new Date(2026, 9, 2, 14, 0).getTime(), grupo: 'hoje' })
  })
})

describe('ordenar linhas', () => {
  it('ordena texto ignorando acento e caixa', () => {
    const ls = [linha('b', { cliente: 'Bruno' }), linha('a', { cliente: 'Álvaro' }), linha('c', { cliente: 'carlos' })]
    expect(ids(ordenarLinhas(ls, 'cliente', 'asc'))).toEqual(['a', 'b', 'c'])
    expect(ids(ordenarLinhas(ls, 'cliente', 'desc'))).toEqual(['c', 'b', 'a'])
  })

  it('números dentro do texto ordenam como números (C2 antes de C10)', () => {
    const ls = [linha('x', { documento: 'C10' }), linha('y', { documento: 'C2' }), linha('z', { documento: 'C1' })]
    expect(ids(ordenarLinhas(ls, 'documento', 'asc'))).toEqual(['z', 'y', 'x'])
  })

  it('vazios ficam sempre no fim, nas duas direções', () => {
    const ls = [linha('v1'), linha('b', { armador: 'Maersk' }), linha('a', { armador: 'MSC' })]
    expect(ids(ordenarLinhas(ls, 'armador', 'asc'))).toEqual(['b', 'a', 'v1'])
    expect(ids(ordenarLinhas(ls, 'armador', 'desc'))).toEqual(['a', 'b', 'v1'])
  })

  it('é estável: empate mantém a ordem de entrada', () => {
    const ls = [linha('1', { armador: 'MSC' }), linha('2', { armador: 'MSC' }), linha('3', { armador: 'MSC' })]
    expect(ids(ordenarLinhas(ls, 'armador', 'asc'))).toEqual(['1', '2', '3'])
    expect(ids(ordenarLinhas(ls, 'armador', 'desc'))).toEqual(['1', '2', '3'])
  })

  it('etapas ordenam pela fração feita; sem etapas vai para o fim', () => {
    const ls = [
      linha('meio', { etapasFeitas: 1, etapasTotal: 2 }),
      linha('tudo', { etapasFeitas: 3, etapasTotal: 3 }),
      linha('nada', { etapasFeitas: 0, etapasTotal: 0 }),
      linha('pouco', { etapasFeitas: 1, etapasTotal: 4 }),
    ]
    expect(ids(ordenarLinhas(ls, 'etapas', 'asc'))).toEqual(['pouco', 'meio', 'tudo', 'nada'])
    expect(ids(ordenarLinhas(ls, 'etapas', 'desc'))).toEqual(['tudo', 'meio', 'pouco', 'nada'])
  })

  it('prazo ordena pela data; sem prazo vai para o fim', () => {
    const ls = [linha('depois', { prazo: 200 }), linha('sem'), linha('antes', { prazo: 100 })]
    expect(ids(ordenarLinhas(ls, 'prazo', 'asc'))).toEqual(['antes', 'depois', 'sem'])
    expect(ids(ordenarLinhas(ls, 'prazo', 'desc'))).toEqual(['depois', 'antes', 'sem'])
  })

  it('próxima ação ordena pelo texto', () => {
    const ls = [linha('b', { acao: { texto: 'Gerar CTe', tom: 'neutral' } }), linha('a', { acao: { texto: 'Agendar carregamento', tom: 'neutral' } })]
    expect(ids(ordenarLinhas(ls, 'acao', 'asc'))).toEqual(['a', 'b'])
  })

  it('não altera a lista original', () => {
    const ls = [linha('b', { cliente: 'B' }), linha('a', { cliente: 'A' })]
    ordenarLinhas(ls, 'cliente', 'asc')
    expect(ids(ls)).toEqual(['b', 'a'])
  })
})
