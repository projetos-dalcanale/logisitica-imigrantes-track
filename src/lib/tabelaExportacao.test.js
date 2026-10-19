import { describe, expect, it } from 'vitest'
import { csvCell, neutralizarFormula, tabelaProcessos } from './tabelaExportacao'
import { novoChecklistImport } from './processos'

const NOW = new Date(2026, 9, 2, 10, 0).getTime()

const imp = (extra = {}, containers = [{ id: 'c1', numero: 'MSCU 123.456-6', tipo: "40'HC" }]) => ({
  id: 'i1', type: 'import', status: 'active', createdAt: '2026-10-01T10:00',
  importador: 'Agro Vale', armador: 'MSC', documentoTipo: 'DTA', documentoNumero: '26/0001',
  termCarga: 'Terminal Alfa', termVazio: 'Depot Sul', finalizacaoVazio: 'devolucao',
  containers: containers.map((c) => ({ checklist: novoChecklistImport(), ...c })),
  ...extra,
})

const CABECALHO = [
  'Tipo', 'Status', 'Armador', 'Motorista', 'Placas',
  'Importador/Exportador', 'Documento/Booking', 'Referência', 'Navio',
  'Terminal de Carregamento', 'Terminal de Vazio', 'Destino do Contêiner',
  'Contêineres', 'Qtd. Contêineres', 'Observações', 'Criado em',
  'Próxima ação', 'Prazo',
]

describe('tabela de exportação', () => {
  it('cabeçalho: as 16 colunas do CSV de antes, na mesma ordem, e Próxima ação e Prazo no fim', () => {
    expect(tabelaProcessos([], NOW).cabecalho).toEqual(CABECALHO)
  })

  it('toda linha tem uma célula por coluna', () => {
    const { linhas } = tabelaProcessos([imp(), imp({ type: 'export', exportador: 'Café', booking: 'B1' })], NOW)
    expect(linhas.every((l) => l.length === CABECALHO.length)).toBe(true)
  })

  it('importação com 2 contêineres e motoristas diferentes', () => {
    const p = imp({ placas: '' }, [
      { id: 'c1', numero: 'MSCU 123.456-6', tipo: "40'HC", motorista: 'Ana', placas: 'ABC1D23' },
      { id: 'c2', numero: 'TGHU 765.432-1', motorista: 'João', placas: 'XYZ9K88' },
    ])
    const [l] = tabelaProcessos([p], NOW).linhas
    expect(l.slice(0, 16)).toEqual([
      'Importação', 'Ativo', 'MSC', 'Ana | João', 'ABC1D23 | XYZ9K88',
      'Agro Vale', 'DTA 26/0001', '', '',
      'Terminal Alfa', 'Depot Sul', 'Devolução de Vazio',
      "MSCU 123.456-6 (40'HC) - Ana | TGHU 765.432-1 - João", 2, '', '01/10/2026 10:00',
    ])
  })

  it('exportação: booking como documento, sem terminais e sem destino', () => {
    const p = { id: 'e1', type: 'export', status: 'archived', createdAt: '2026-10-01T10:00', exportador: 'Café Sul', booking: 'BKG777', navio: 'Alfa', armador: 'Maersk', containers: [{ id: 'c1', numero: 'MAEU 765.432-1' }] }
    const [l] = tabelaProcessos([p], NOW).linhas
    expect(l.slice(0, 13)).toEqual(['Exportação', 'Arquivado', 'Maersk', '', '', 'Café Sul', 'BKG777', '', 'Alfa', '', '', '', 'MAEU 765.432-1'])
  })

  it('carga solta: destino "Carga solta", descrição no lugar do contêiner e quantidade 0', () => {
    const [l] = tabelaProcessos([imp({ modalidade: 'solta', carga: '104 caixas' })], NOW).linhas
    expect(l[11]).toBe('Carga solta')
    expect(l[12]).toBe('104 caixas')
    expect(l[13]).toBe(0)
  })

  it('baixa não tem terminal de vazio e o destino é "Baixa de Contêiner"', () => {
    const [l] = tabelaProcessos([imp({ finalizacaoVazio: 'baixa' })], NOW).linhas
    expect([l[10], l[11]]).toEqual(['', 'Baixa de Contêiner'])
  })

  it('campos ausentes viram texto vazio e o processo sem contêiner não quebra', () => {
    const [l] = tabelaProcessos([{ id: 'x', type: 'import', status: 'active', containers: [] }], NOW).linhas
    expect(l[2]).toBe('')
    expect(l[12]).toBe('')
    expect(l[13]).toBe(0)
  })

  it('traz a próxima ação e o prazo (data do compromisso pendente mais cedo)', () => {
    const p = imp({}, [{ id: 'c1', numero: 'A', checklist: { ...novoChecklistImport(), ag_carga: '2026-10-02T14:00' } }])
    const [l] = tabelaProcessos([p], NOW).linhas
    expect(l[16]).toBe('Carregamento hoje 14:00 · confirmar')
    expect(l[17]).toBe('02/10/2026 14:00')
    const [vazio] = tabelaProcessos([imp()], NOW).linhas
    expect([vazio[16], vazio[17]]).toEqual(['Agendar carregamento', ''])
  })
})

describe('proteção contra fórmula e aspas do CSV', () => {
  it('texto que começa com = + - @ ganha apóstrofo na frente', () => {
    expect(neutralizarFormula('=1+1')).toBe("'=1+1")
    expect(neutralizarFormula('+55 13 99999')).toBe("'+55 13 99999")
    expect(neutralizarFormula('-cmd')).toBe("'-cmd")
    expect(neutralizarFormula('@SOMA(A1)')).toBe("'@SOMA(A1)")
    expect(neutralizarFormula('Texto normal')).toBe('Texto normal')
    expect(neutralizarFormula('')).toBe('')
  })

  it('csvCell: aspas quando há ;, aspas ou quebra de linha; números ficam como estão', () => {
    expect(csvCell('a;b')).toBe('"a;b"')
    expect(csvCell('diz "oi"')).toBe('"diz ""oi"""')
    expect(csvCell('linha1\nlinha2')).toBe('"linha1\nlinha2"')
    expect(csvCell('linha1\rlinha2')).toBe('"linha1\rlinha2"')
    expect(csvCell(3)).toBe('3')
    expect(csvCell(null)).toBe('')
    expect(csvCell(undefined)).toBe('')
  })

  it('csvCell neutraliza fórmula e ainda coloca aspas se precisar', () => {
    expect(csvCell('=HYPERLINK("http://x";"a")')).toBe(`"'=HYPERLINK(""http://x"";""a"")"`)
  })
})
