import { describe, expect, it } from 'vitest'
import { comContainers, dadosDoProcesso, montarStatus, rotuloContainer, saudacao } from './status'

const imp = {
  type: 'import',
  importador: 'Agro Sul Fertilizantes',
  documentoTipo: 'DTA',
  documentoNumero: '26/0012345',
  containers: [{ numero: 'HLXU 222.333-4' }, { numero: '' }],
}

describe('status para clientes', () => {
  it('pega só cliente, documento e contêineres', () => {
    expect(dadosDoProcesso(imp)).toEqual({
      cliente: 'Agro Sul Fertilizantes',
      documento: { rotulo: 'DTA', numero: '26/0012345' },
      containers: ['HLXU 222.333-4'],
      unidades: ['HLXU 222.333-4'],
      rotuloUnidade: 'Contêiner',
    })
  })

  it('carga solta mostra a descrição da carga no lugar do contêiner', () => {
    const solta = { ...imp, modalidade: 'solta', carga: '104 caixas', containers: [{ numero: '' }] }
    expect(dadosDoProcesso(solta)).toMatchObject({ containers: ['104 caixas'], rotuloUnidade: 'Carga' })
    const { assunto, texto } = montarStatus(solta, '')
    expect(assunto).toBe('Status – Agro Sul Fertilizantes – DTA 26/0012345 – 104 caixas')
    expect(texto).toContain('Carga: 104 caixas')
  })

  it('exportação usa o booking', () => {
    const d = dadosDoProcesso({ type: 'export', exportador: 'Café Serra', booking: 'MSC123', containers: [{ numero: 'A' }, { numero: 'B' }] })
    expect(d.documento).toEqual({ rotulo: 'Booking', numero: 'MSC123' })
    expect(d.containers).toEqual(['A', 'B'])
  })

  it('monta assunto e texto com a mensagem e os dados', () => {
    const { assunto, texto } = montarStatus(imp, 'Bom dia a todos.\nCarregamento liberado.')
    expect(assunto).toBe('Status – Agro Sul Fertilizantes – DTA 26/0012345 – HLXU 222.333-4')
    expect(texto).toBe('Bom dia a todos.\nCarregamento liberado.\n\nCliente: Agro Sul Fertilizantes\nDTA: 26/0012345\nContêiner: HLXU 222.333-4')
  })

  it('no plural com mais de um contêiner e sem linhas vazias', () => {
    const { texto } = montarStatus({ type: 'export', exportador: 'X', containers: [{ numero: 'A' }, { numero: 'B' }] }, '')
    expect(texto).toBe('Cliente: X\nContêineres: A, B')
  })

  it('o HTML escapa o que foi digitado', () => {
    const { html } = montarStatus(imp, 'Prazo <urgente> & "hoje"')
    expect(html).toContain('Prazo &lt;urgente&gt; &amp; &quot;hoje&quot;')
    expect(html).toContain('<b>DTA:</b> 26/0012345')
  })

  it('saudação conforme a hora', () => {
    expect(saudacao(new Date(2026, 9, 5, 8))).toBe('Bom dia')
    expect(saudacao(new Date(2026, 9, 5, 14))).toBe('Boa tarde')
    expect(saudacao(new Date(2026, 9, 5, 19))).toBe('Boa noite')
  })
})

describe('tipo do contêiner e escolha dos contêineres', () => {
  const multi = {
    type: 'import',
    importador: 'Agro Sul',
    documentoTipo: 'DTA',
    documentoNumero: '26/1',
    containers: [
      { id: 'a', numero: 'MSCU 111.111-1', tipo: "40'HC" },
      { id: 'b', numero: 'MSCU 222.222-2', tipo: "20'DC" },
      { id: 'c', numero: 'MSCU 333.333-3', tipo: '' },
      { id: 'd', numero: 'MSCU 444.444-4' },
    ],
  }

  it('rotuloContainer: o tipo vai ao lado do número; sem tipo, só o número; sem número, nada', () => {
    expect(rotuloContainer({ numero: ' MSCU 1 ', tipo: " 40'HC " })).toBe("MSCU 1 (40'HC)")
    expect(rotuloContainer({ numero: 'MSCU 1' })).toBe('MSCU 1')
    expect(rotuloContainer({ numero: 'MSCU 1', tipo: '' })).toBe('MSCU 1')
    expect(rotuloContainer({ numero: '', tipo: "40'HC" })).toBe('')
  })

  it('dadosDoProcesso traz os nomes com o tipo (unidades) e mantém os números puros', () => {
    const d = dadosDoProcesso(multi)
    expect(d.unidades).toEqual(["MSCU 111.111-1 (40'HC)", "MSCU 222.222-2 (20'DC)", 'MSCU 333.333-3', 'MSCU 444.444-4'])
    expect(d.containers).toEqual(['MSCU 111.111-1', 'MSCU 222.222-2', 'MSCU 333.333-3', 'MSCU 444.444-4'])
  })

  it('o texto do e-mail mostra o tipo; o assunto continua só com os números', () => {
    const { assunto, texto } = montarStatus(multi, '')
    expect(texto).toContain("Contêineres: MSCU 111.111-1 (40'HC), MSCU 222.222-2 (20'DC), MSCU 333.333-3, MSCU 444.444-4")
    expect(assunto).toBe('Status – Agro Sul – DTA 26/1 – MSCU 111.111-1, MSCU 222.222-2, MSCU 333.333-3, MSCU 444.444-4')
  })

  it('comContainers fica só com os escolhidos, na ordem gravada, sem alterar o processo original', () => {
    const so = comContainers(multi, ['d', 'b'])
    expect(so.containers.map((c) => c.id)).toEqual(['b', 'd'])
    expect(so).toMatchObject({ importador: 'Agro Sul', documentoNumero: '26/1' })
    expect(multi.containers).toHaveLength(4)
  })

  it('sem escolha, com ids que não existem ou em carga solta devolve o processo inteiro', () => {
    expect(comContainers(multi, [])).toBe(multi)
    expect(comContainers(multi, undefined)).toBe(multi)
    expect(comContainers(multi, ['x', 'y'])).toBe(multi)
    const solta = { ...multi, modalidade: 'solta', carga: '104 caixas' }
    expect(comContainers(solta, ['a'])).toBe(solta)
  })

  it('o status de um processo filtrado só fala dos contêineres escolhidos', () => {
    const { assunto, texto } = montarStatus(comContainers(multi, ['b']), '')
    expect(assunto).toBe('Status – Agro Sul – DTA 26/1 – MSCU 222.222-2')
    expect(texto).toContain("Contêiner: MSCU 222.222-2 (20'DC)")
    expect(texto).not.toContain('MSCU 111.111-1')
  })
})
