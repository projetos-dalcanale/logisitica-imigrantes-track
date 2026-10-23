import { describe, expect, it } from 'vitest'
import { EMPRESA } from '../marca'
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

  it('baixa de contêiner troca a devolução do vazio por carga entregue', () => {
    const etapas = etapasDoContainer({ ...imp, finalizacaoVazio: 'baixa' }, imp.containers[0]).map((e) => e.label)
    expect(etapas).toHaveLength(6)
    expect(etapas).not.toContain('Devolução concluída')
    expect(etapas.at(-1)).toBe('Carga entregue')
  })

  it('carga solta: mostra a descrição no lugar do contêiner e segue as etapas da baixa', () => {
    const solta = { ...imp, modalidade: 'solta', carga: '104 caixas', finalizacaoVazio: undefined }
    const html = montarHtmlProcesso(solta)
    expect(html).toContain('Carga solta')
    expect(html).toContain('104 caixas')
    expect(html).not.toContain('Destino do contêiner')
    expect(etapasDoContainer(solta, imp.containers[0]).map((e) => e.label).at(-1)).toBe('Carga entregue')
  })

  it('exportação usa as três etapas, com terminal no nome', () => {
    const ct = { agVazio: '2026-10-01T09:00', agVazioCheck: 'true', termVazioExp: 'Depot Cubatão' }
    const etapas = etapasDoContainer({ type: 'export' }, ct)
    expect(etapas.map((e) => e.feito)).toEqual([true, false, false])
    expect(etapas[0].label).toBe('Retirada do vazio · Depot Cubatão')
  })

  it('monta a ficha com a marca, os dados e escapa o que foi digitado', () => {
    const html = montarHtmlProcesso(imp, new Date(2026, 9, 5, 9, 30))
    expect(html).toContain(EMPRESA)
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

describe('PDF: terminal de devolução', () => {
  const caixa = (rotulo, valor) => `<span class="pf-rot">${rotulo}</span><span class="pf-val">${valor}</span>`
  const dois = (extra = {}) => ({
    ...imp,
    termVazio: 'Depot Sul',
    containers: [
      { id: 'a', numero: 'OOCU 704.568-8', termVazio: 'Depot Norte', checklist: {} },
      { id: 'b', numero: 'TGHU 765.432-1', checklist: {} },
    ],
    ...extra,
  })

  it('com um contêiner, o terminal vai na linha de destino', () => {
    const html = montarHtmlProcesso({ ...imp, termVazio: 'Depot Sul' })
    expect(html).toContain(caixa('Destino do contêiner', 'Devolução · Depot Sul'))
    expect(html).not.toContain('Terminal de devolução')
  })

  it('com 2 contêineres, cada bloco mostra o terminal do contêiner e o destino fica sem terminal', () => {
    const html = montarHtmlProcesso(dois())
    expect(html).toContain(caixa('Destino do contêiner', 'Devolução'))
    expect(html).toContain(caixa('Terminal de devolução', 'Depot Norte'))
    expect(html).toContain(caixa('Terminal de devolução', 'Depot Sul'))
  })

  it('na baixa não aparece terminal nenhum', () => {
    const html = montarHtmlProcesso(dois({ finalizacaoVazio: 'baixa' }))
    expect(html).not.toContain('Terminal de devolução')
    expect(html).not.toContain('Depot')
  })
})

describe('PDF: ordem dos contêineres', () => {
  const ct = (id, numero, motorista, placas, data) => ({ id, numero, motorista, placas, checklist: { ag_carga: data } })
  const proc = {
    ...imp,
    motorista: '',
    placas: '',
    containers: [
      ct('a', 'OOCU 704.568-8', 'Ana', 'AAA1A11', '2026-10-05T10:00'),
      ct('b', 'TGHU 765.432-1', 'Bia', 'BBB2B22', '2026-10-03T10:00'),
    ],
  }
  const blocos = (html) => html.split('<div class="pf-ct">').slice(1)

  it('os blocos saem na ordem das datas, numerados pela ordem exibida', () => {
    const [primeiro, segundo] = blocos(montarHtmlProcesso(proc))
    expect(primeiro).toContain('Contêiner 1')
    expect(primeiro).toContain('TGHU 765.432-1')
    expect(segundo).toContain('Contêiner 2')
    expect(segundo).toContain('OOCU 704.568-8')
  })

  it('motorista e placas acompanham o contêiner, não a posição', () => {
    const [primeiro, segundo] = blocos(montarHtmlProcesso(proc))
    expect(primeiro).toContain('Bia')
    expect(primeiro).toContain('BBB2B22')
    expect(primeiro).not.toContain('Ana')
    expect(segundo).toContain('Ana')
    expect(segundo).toContain('AAA1A11')
    expect(segundo).not.toContain('Bia')
  })

  it('sem datas mantém a ordem gravada', () => {
    const semDatas = { ...proc, containers: proc.containers.map((c) => ({ ...c, checklist: {} })) }
    const [primeiro] = blocos(montarHtmlProcesso(semDatas))
    expect(primeiro).toContain('OOCU 704.568-8')
  })
})

describe('PDF: placa cavalo e carreta', () => {
  const caixa = (rotulo, valor) => `<span class="pf-rot">${rotulo}</span><span class="pf-val">${valor}</span>`
  const blocos = (html) => html.split('<div class="pf-ct">').slice(1)

  it('com um contêiner, as duas placas aparecem como caixas separadas do processo', () => {
    const html = montarHtmlProcesso({ ...imp, placas: '', placaCavalo: 'ABC1D23', placaCarreta: 'XYZ9K88' })
    expect(html).toContain(caixa('Placa cavalo', 'ABC1D23'))
    expect(html).toContain(caixa('Placa carreta', 'XYZ9K88'))
  })

  it('com vários contêineres, cada bloco traz as placas do seu contêiner', () => {
    const proc = {
      ...imp,
      placas: '',
      containers: [
        { id: 'a', numero: 'OOCU 704.568-8', placaCavalo: 'AAA1A11', placaCarreta: 'BBB2B22', checklist: {} },
        { id: 'b', numero: 'TGHU 765.432-1', placaCavalo: 'CCC3C33', placaCarreta: 'DDD4D44', checklist: {} },
      ],
    }
    const [um, dois] = blocos(montarHtmlProcesso(proc))
    expect(um).toContain(caixa('Placa cavalo', 'AAA1A11'))
    expect(um).toContain(caixa('Placa carreta', 'BBB2B22'))
    expect(dois).toContain(caixa('Placa cavalo', 'CCC3C33'))
    expect(dois).toContain(caixa('Placa carreta', 'DDD4D44'))
  })

  it('dado antigo (só o texto) continua aparecendo como "Placas"', () => {
    const html = montarHtmlProcesso({ ...imp, placas: 'ABC1D23' })
    expect(html).toContain(caixa('Placas', 'ABC1D23'))
    expect(html).not.toContain('Placa cavalo')
  })
})
