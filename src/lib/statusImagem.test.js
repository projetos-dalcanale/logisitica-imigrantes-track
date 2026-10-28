import { describe, expect, it } from 'vitest'
import { agendamentosDosContainers, crc32, dadosDosContainers, etapasDaImagem, filtrosDeAgendamento, gradeDeAgendamentos, gradeDosContainers, opcoesDeStatus, pngComDpi, quebrarLinhas } from './statusImagem'

describe('imagem de status', () => {
  it('etapas e situações por tipo de processo', () => {
    expect(etapasDaImagem({ type: 'import' })).toEqual(['Liberado', 'Em rota', 'Entregue', 'Vazio devolvido'])
    expect(etapasDaImagem({ type: 'export' })).toHaveLength(4)
    expect(opcoesDeStatus({ type: 'import' }).map((o) => o.id)).toContain('devolvido')
  })

  it('baixa de contêiner não tem devolução do vazio', () => {
    expect(etapasDaImagem({ type: 'import', finalizacaoVazio: 'baixa' })).toEqual(['Liberado', 'Em rota', 'Entregue'])
    expect(opcoesDeStatus({ type: 'import', finalizacaoVazio: 'baixa' }).map((o) => o.id)).not.toContain('devolvido')
  })

  it('quebra o texto pela largura e respeita as quebras de linha', () => {
    const medir = (t) => t.length * 10
    expect(quebrarLinhas('um dois tres quatro', 90, medir)).toEqual(['um dois', 'tres', 'quatro'])
    expect(quebrarLinhas('linha 1\nlinha 2\n', 500, medir)).toEqual(['linha 1', 'linha 2'])
    expect(quebrarLinhas('', 500, medir)).toEqual([])
  })

  it('CRC32 do PNG', () => {
    expect(crc32(new TextEncoder().encode('IEND'))).toBe(0xae426082)
  })

  it('insere o DPI (pHYs) logo depois do cabeçalho do PNG', () => {
    const png = new Uint8Array(33 + 12).fill(7) // assinatura + IHDR (33 bytes) + resto
    const out = pngComDpi(png, 192)
    expect(out.length).toBe(png.length + 21)
    expect(new TextDecoder().decode(out.subarray(37, 41))).toBe('pHYs')
    const ppm = new DataView(out.buffer).getUint32(41)
    expect(ppm).toBe(Math.round(192 / 0.0254))
    expect(out.subarray(54)).toEqual(png.subarray(33))
  })
})

describe('dados do contêiner (exportação)', () => {
  it('existe só na exportação, com texto pronto e tabela', () => {
    const dados = opcoesDeStatus({ type: 'export' }).find((o) => o.id === 'dados')
    expect(dados).toMatchObject({ etapa: null, tabela: true, detalhes: 'Segue abaixo dados do container e fotos em anexo para conferência.' })
    expect(opcoesDeStatus({ type: 'import' }).some((o) => o.id === 'dados')).toBe(false)
  })

  it('numeração, tara (com kg quando só número) e lacre de cada contêiner', () => {
    const proc = { containers: [{ numero: 'MSCU 999.888-7', tara: '3800', lacre: 'L123' }, { numero: '', tara: '3.750 kg', lacre: '' }] }
    expect(dadosDosContainers(proc)).toEqual([
      { numero: 'MSCU 999.888-7', tara: '3.800 kg', lacre: 'L123' },
      { numero: '—', tara: '3.750 kg', lacre: '—' },
    ])
  })
})

describe('status dos agendamentos', () => {
  const imp = (cts, extra = {}) => ({
    type: 'import',
    containers: cts.map((c, i) => ({ id: `c${i}`, numero: `N${i}`, ...c, checklist: c.checklist || {} })),
    ...extra,
  })
  const exp = (cts) => ({ type: 'export', containers: cts.map((c, i) => ({ id: `c${i}`, numero: `N${i}`, ...c })) })
  const rotulos = (r) => r.colunas.map((c) => c.rotulo)
  const numeros = (r) => r.linhas.map((l) => l.numero)

  it('existe nos dois tipos, antes de "Atualização do processo", sem barra de progresso', () => {
    for (const type of ['import', 'export']) {
      const ids = opcoesDeStatus({ type }).map((o) => o.id)
      expect(ids.indexOf('agendamentos')).toBeGreaterThan(-1)
      expect(ids.indexOf('agendamentos')).toBe(ids.indexOf('outro') - 1)
      expect(opcoesDeStatus({ type }).find((o) => o.id === 'agendamentos')).toMatchObject({ titulo: 'Status dos agendamentos', etapa: null, agendamentos: true })
    }
  })

  it('importação: cheios é o carregamento e vazios é a devolução do vazio', () => {
    const p = imp([{}])
    expect(rotulos(agendamentosDosContainers(p, 'ambos'))).toEqual(['Carregamento', 'Devolução do vazio'])
    expect(rotulos(agendamentosDosContainers(p, 'cheios'))).toEqual(['Carregamento'])
    expect(rotulos(agendamentosDosContainers(p, 'vazios'))).toEqual(['Devolução do vazio'])
  })

  it('exportação: vazios é a retirada do vazio e cheios é o depósito do cheio, sem estufagem', () => {
    const p = exp([{}])
    expect(rotulos(agendamentosDosContainers(p, 'ambos'))).toEqual(['Retirada do vazio', 'Depósito do cheio'])
    expect(rotulos(agendamentosDosContainers(p, 'cheios'))).toEqual(['Depósito do cheio'])
    expect(rotulos(agendamentosDosContainers(p, 'vazios'))).toEqual(['Retirada do vazio'])
    expect(agendamentosDosContainers(p, 'ambos').colunas.map((c) => c.id)).not.toContain('estufagem')
  })

  it('ordena pela menor data entre as colunas exibidas', () => {
    const p = imp([
      { checklist: { ag_carga: '2026-10-10T10:00', ag_vazio: '2026-10-12T10:00' } },
      { checklist: { ag_carga: '2026-10-11T10:00', ag_vazio: '2026-10-09T10:00' } },
    ])
    expect(numeros(agendamentosDosContainers(p, 'cheios'))).toEqual(['N0', 'N1'])
    expect(numeros(agendamentosDosContainers(p, 'vazios'))).toEqual(['N1', 'N0'])
    expect(numeros(agendamentosDosContainers(p, 'ambos'))).toEqual(['N1', 'N0'])
  })

  it('sem nenhuma data vai para o fim e o empate mantém a ordem gravada', () => {
    const p = imp([{}, { checklist: { ag_carga: '2026-10-10T10:00' } }, {}, { checklist: { ag_carga: '2026-10-10T10:00' } }])
    expect(numeros(agendamentosDosContainers(p, 'cheios'))).toEqual(['N1', 'N3', 'N0', 'N2'])
  })

  it('datas no formato curto, traço quando falta data ou número', () => {
    const p = imp([{ numero: '', checklist: { ag_carga: '2026-10-03T14:00' } }])
    expect(agendamentosDosContainers(p, 'ambos').linhas).toEqual([{ numero: '—', valores: ['03/10 14:00', '—'] }])
    const e = exp([{ numero: 'MAEU 1', agVazio: '2026-10-04T08:30' }])
    expect(agendamentosDosContainers(e, 'ambos').linhas).toEqual([{ numero: 'MAEU 1', valores: ['04/10 08:30', '—'] }])
  })

  it('filtros disponíveis: Cheios, Vazios e Os dois, e só Cheios na baixa e na carga solta', () => {
    const tres = [['cheios', 'Cheios'], ['vazios', 'Vazios'], ['ambos', 'Os dois']]
    expect(filtrosDeAgendamento(imp([{}])).map((f) => [f.value, f.label])).toEqual(tres)
    expect(filtrosDeAgendamento(exp([{}])).map((f) => [f.value, f.label])).toEqual(tres)
    expect(filtrosDeAgendamento(imp([{}], { finalizacaoVazio: 'baixa' })).map((f) => f.value)).toEqual(['cheios'])
    expect(filtrosDeAgendamento(imp([{}], { modalidade: 'solta' })).map((f) => f.value)).toEqual(['cheios'])
  })

  it('na baixa e na carga solta não existe coluna de vazios, mesmo pedindo "os dois" ou "vazios"', () => {
    for (const extra of [{ finalizacaoVazio: 'baixa' }, { modalidade: 'solta', carga: '104 caixas' }]) {
      const p = imp([{}], extra)
      expect(rotulos(agendamentosDosContainers(p, 'ambos'))).toEqual(['Carregamento'])
      expect(rotulos(agendamentosDosContainers(p, 'vazios'))).toEqual(['Carregamento'])
    }
  })

  it('processo sem contêineres devolve só as colunas', () => {
    expect(agendamentosDosContainers({ type: 'import' }, 'ambos')).toEqual({
      colunas: [{ id: 'ag_carga', rotulo: 'Carregamento' }, { id: 'ag_vazio', rotulo: 'Devolução do vazio' }],
      linhas: [],
    })
  })
})

describe('tabelas da imagem de status', () => {
  const contiguas = (colunas) => colunas.every((c, i) => c.ini === (i === 0 ? 0 : colunas[i - 1].fim)) && colunas.at(-1).fim === 1

  it('dados do contêiner mantêm as proporções de antes (45% / 25% / 30%)', () => {
    const proc = { containers: [{ numero: 'MSCU 999.888-7', tara: '3800', lacre: 'L123' }] }
    const g = gradeDosContainers(proc)
    expect(g.colunas.map((c) => [c.rotulo, c.ini, c.fim])).toEqual([['Contêiner', 0, 0.45], ['Tara', 0.45, 0.7], ['Lacre', 0.7, 1]])
    expect(g.linhas).toEqual([['MSCU 999.888-7', '3.800 kg', 'L123']])
  })

  it('agendamentos: contêiner + uma coluna por data, ocupando toda a largura', () => {
    const proc = { type: 'import', containers: [{ id: 'a', numero: 'MSCU 1', checklist: { ag_carga: '2026-10-03T14:00' } }] }
    const dois = gradeDeAgendamentos(proc, 'ambos')
    expect(dois.colunas.map((c) => c.rotulo)).toEqual(['Contêiner', 'Carregamento', 'Devolução do vazio'])
    expect(contiguas(dois.colunas)).toBe(true)
    expect(dois.linhas).toEqual([['MSCU 1', '03/10 14:00', '—']])
    const um = gradeDeAgendamentos(proc, 'cheios')
    expect(um.colunas.map((c) => c.rotulo)).toEqual(['Contêiner', 'Carregamento'])
    expect(contiguas(um.colunas)).toBe(true)
  })

  it('agendamentos sem contêineres tem as colunas e nenhuma linha', () => {
    const g = gradeDeAgendamentos({ type: 'export' }, 'ambos')
    expect(g.linhas).toEqual([])
    expect(g.colunas).toHaveLength(3)
  })
})

describe('tipo do contêiner nas tabelas da imagem', () => {
  it('dados do contêiner: o tipo vai ao lado da numeração; sem tipo fica como antes', () => {
    const proc = { containers: [{ numero: 'MSCU 999.888-7', tipo: "40'HC", tara: '3800', lacre: 'L1' }, { numero: 'MSCU 111.222-3', tara: '', lacre: '' }] }
    expect(dadosDosContainers(proc).map((l) => l.numero)).toEqual(["MSCU 999.888-7 (40'HC)", 'MSCU 111.222-3'])
    expect(gradeDosContainers(proc).linhas[0][0]).toBe("MSCU 999.888-7 (40'HC)")
  })

  it('status dos agendamentos: o tipo vai ao lado do número, e carga solta continua com a descrição', () => {
    const proc = { type: 'import', containers: [{ id: 'a', numero: 'MSCU 1', tipo: "20'DC", checklist: {} }, { id: 'b', numero: 'MSCU 2', checklist: {} }] }
    expect(agendamentosDosContainers(proc, 'ambos').linhas.map((l) => l.numero)).toEqual(["MSCU 1 (20'DC)", 'MSCU 2'])
    const solta = { type: 'import', modalidade: 'solta', carga: '104 caixas', containers: [{ id: 'a', numero: '', tipo: "40'HC", checklist: {} }] }
    expect(agendamentosDosContainers(solta, 'cheios').linhas.map((l) => l.numero)).toEqual(['104 caixas'])
  })
})
