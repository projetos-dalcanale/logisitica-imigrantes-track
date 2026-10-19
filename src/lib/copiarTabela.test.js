import { describe, expect, it } from 'vitest'
import { htmlDaTabela, textoDaTabela } from './copiarTabela'

const tabela = {
  cabecalho: ['Cliente', 'Obs.'],
  linhas: [['Agro <b>Vale</b> & Cia', 'diz "oi"\nsegunda linha'], ['Café', 3]],
}

describe('copiar tabela para o e-mail', () => {
  it('HTML com uma linha de cabeçalho e uma linha por processo', () => {
    const html = htmlDaTabela(tabela)
    expect((html.match(/<tr/g) || []).length).toBe(3)
    expect((html.match(/<th/g) || []).length).toBe(2)
    expect((html.match(/<td/g) || []).length).toBe(4)
  })

  it('escapa HTML dos valores (não deixa virar marcação)', () => {
    const html = htmlDaTabela({ cabecalho: ['A'], linhas: [['<script>alert(1)</script>']] })
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(htmlDaTabela(tabela)).toContain('Agro &lt;b&gt;Vale&lt;/b&gt; &amp; Cia')
    expect(htmlDaTabela(tabela)).toContain('diz &quot;oi&quot;')
  })

  it('quebra de linha vira <br> e número aparece como texto', () => {
    const html = htmlDaTabela(tabela)
    expect(html).toContain('<br>')
    expect(html).toContain('>3<')
  })

  it('usa estilos inline (o Outlook ignora <style> e classes)', () => {
    const html = htmlDaTabela(tabela)
    expect(html).toContain('border-collapse')
    expect(html).not.toContain('<style')
    expect(html).not.toContain('class=')
  })

  it('texto simples em colunas separadas por tab, sem tab nem quebra dentro das células', () => {
    const texto = textoDaTabela({ cabecalho: ['A', 'B'], linhas: [['x\ty', 'linha1\nlinha2'], ['z', 5]] })
    expect(texto.split('\n')).toEqual(['A\tB', 'x y\tlinha1 linha2', 'z\t5'])
  })

  it('tabela sem linhas ainda tem o cabeçalho', () => {
    expect(textoDaTabela({ cabecalho: ['A'], linhas: [] })).toBe('A')
    expect((htmlDaTabela({ cabecalho: ['A'], linhas: [] }).match(/<tr/g) || []).length).toBe(1)
  })
})
