import { describe, expect, it } from 'vitest'
import { crc32, dadosDosContainers, etapasDaImagem, opcoesDeStatus, pngComDpi, quebrarLinhas } from './statusImagem'

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
