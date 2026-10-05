import { describe, expect, it } from 'vitest'
import { dadosDoProcesso, montarStatus, saudacao } from './status'

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
    })
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
