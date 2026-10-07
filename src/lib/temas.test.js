import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CORES, COR_PADRAO, aplicarCor, corDaBarra, normalizarCor } from './temas'

const raiz = new URL('../../', import.meta.url)
const css = readFileSync(new URL('src/index.css', raiz), 'utf8')
const html = readFileSync(new URL('index.html', raiz), 'utf8')
const opcionais = CORES.map((c) => c.id).filter((id) => id !== COR_PADRAO)

// Imita a tag <html>: só o que aplicarCor usa.
function raizFalsa(inicial) {
  const attrs = inicial ? { 'data-accent': inicial } : {}
  return {
    attrs,
    setAttribute: (k, v) => { attrs[k] = v },
    removeAttribute: (k) => { delete attrs[k] },
  }
}

describe('normalizarCor', () => {
  it('aceita as cores da lista', () => {
    for (const c of CORES) expect(normalizarCor(c.id)).toBe(c.id)
  })

  it('volta ao vermelho com valor ausente ou desconhecido', () => {
    for (const v of [null, undefined, '', 'roxo', 'AZUL', '<script>']) expect(normalizarCor(v)).toBe('vermelho')
  })
})

describe('aplicarCor', () => {
  it('grava a cor escolhida em data-accent', () => {
    const root = raizFalsa()
    expect(aplicarCor(root, 'azul')).toBe('azul')
    expect(root.attrs['data-accent']).toBe('azul')
  })

  it('o vermelho (padrão) remove o atributo', () => {
    const root = raizFalsa('laranja')
    expect(aplicarCor(root, 'vermelho')).toBe('vermelho')
    expect(root.attrs).not.toHaveProperty('data-accent')
  })

  it('valor inválido vira vermelho em vez de ir para o atributo', () => {
    const root = raizFalsa('grafite')
    expect(aplicarCor(root, 'qualquer')).toBe('vermelho')
    expect(root.attrs).not.toHaveProperty('data-accent')
  })
})

describe('corDaBarra', () => {
  it('o vermelho mantém a cor de barra de sempre', () => {
    expect(corDaBarra('vermelho')).toBe('#B10004')
    expect(corDaBarra('inexistente')).toBe('#B10004')
  })

  it('cada cor tem a sua', () => {
    expect(new Set(CORES.map((c) => corDaBarra(c.id))).size).toBe(CORES.length)
  })
})

describe('lista de cores em sincronia com o CSS e o index.html', () => {
  it('o index.css tem os tons claro e escuro de cada cor opcional', () => {
    for (const id of opcionais) {
      for (const sel of [`:root[data-accent="${id}"] {`, `:root[data-theme="dark"][data-accent="${id}"] {`]) {
        const inicio = css.indexOf(sel)
        expect(inicio, `falta o bloco ${sel}`).toBeGreaterThan(-1)
        const bloco = css.slice(inicio, css.indexOf('}', inicio))
        for (const tom of [300, 400, 500, 600, 800, 900]) expect(bloco, `${sel} sem --blue-${tom}`).toContain(`--blue-${tom}:`)
      }
    }
  })

  it('o script do index.html aceita exatamente as cores opcionais', () => {
    const lista = html.match(/\/\^\(([a-z|]+)\)\$\//)[1].split('|')
    expect(lista.sort()).toEqual([...opcionais].sort())
  })
})
