import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { lerTokens, razaoContraste, tokensDoTema } from './contraste'
import { CORES, COR_PADRAO } from './temas'

const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8')

describe('razão de contraste (WCAG)', () => {
  it('preto sobre branco é 21 e cor igual é 1', () => {
    expect(razaoContraste([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5)
    expect(razaoContraste([120, 30, 200], [120, 30, 200])).toBeCloseTo(1, 5)
  })

  it('não depende da ordem das cores', () => {
    expect(razaoContraste([10, 20, 30], [200, 210, 220])).toBeCloseTo(razaoContraste([200, 210, 220], [10, 20, 30]), 10)
  })

  it('cinza do texto terciário claro (117 117 122) sobre branco passa de 4,5', () => {
    expect(razaoContraste([117, 117, 122], [255, 255, 255])).toBeGreaterThan(4.5)
  })
})

describe('leitura dos tokens do index.css', () => {
  it('lê os valores "R G B" de um bloco', () => {
    const tokens = lerTokens(css, ':root')
    expect(tokens['navy-800']).toEqual([255, 255, 255])
    expect(lerTokens(css, ':root[data-theme="dark"]')['navy-900']).toEqual([0, 0, 0])
  })

  it('bloco que não existe devolve objeto vazio', () => {
    expect(lerTokens(css, ':root[data-theme="nao-existe"]')).toEqual({})
  })

  it('o destino escolhido sobrescreve o tema (azul escuro usa o azul do escuro)', () => {
    expect(tokensDoTema(css, 'dark', 'azul')['blue-500']).toEqual([10, 132, 255])
    expect(tokensDoTema(css, 'light', 'azul')['blue-500']).toEqual([29, 78, 216])
    expect(tokensDoTema(css, 'dark', COR_PADRAO)['blue-500']).toEqual([255, 69, 58])
  })
})

// Pares (texto, fundo) que o app usa, com o contraste mínimo de cada um.
const SUPERFICIES = ['navy-800', 'navy-900']
const PARES = [
  ...SUPERFICIES.map((fundo) => ({ nome: `texto principal (ink) sobre ${fundo}`, fg: 'ink', bg: fundo, min: 7 })),
  { nome: 'texto principal (ink) sobre campos (navy-700)', fg: 'ink', bg: 'navy-700', min: 7 },
  ...SUPERFICIES.map((fundo) => ({ nome: `texto secundário (slate-400) sobre ${fundo}`, fg: 'slate-400', bg: fundo, min: 4.5 })),
  ...SUPERFICIES.map((fundo) => ({ nome: `texto terciário e placeholder (slate-500) sobre ${fundo}`, fg: 'slate-500', bg: fundo, min: 4.5 })),
  ...SUPERFICIES.map((fundo) => ({ nome: `texto de ação (blue-500) sobre ${fundo}`, fg: 'blue-500', bg: fundo, min: 4.5 })),
  { nome: 'texto de erro (red-500) sobre cartões', fg: 'red-500', bg: 'navy-800', min: 4.5 },
  { nome: 'texto de sucesso (green) sobre cartões', fg: 'green', bg: 'navy-800', min: 4.5 },
  { nome: 'texto de aviso (orange) sobre cartões', fg: 'orange', bg: 'navy-800', min: 4.5 },
]

describe.each(['light', 'dark'])('contraste no tema %s', (tema) => {
  describe.each([COR_PADRAO, ...CORES.map((c) => c.id).filter((id) => id !== COR_PADRAO)])('com a cor de destaque %s', (cor) => {
    const tokens = tokensDoTema(css, tema, cor)
    it.each(PARES)('$nome', ({ fg, bg, min }) => {
      expect(tokens[fg], `token ${fg}`).toBeDefined()
      expect(tokens[bg], `token ${bg}`).toBeDefined()
      expect(razaoContraste(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(min)
    })

    // Rótulo branco de botão (negrito, 14 px ou mais): vale o mínimo de texto grande.
    it('rótulo branco sobre o botão de destaque (blue-500)', () => {
      expect(razaoContraste([255, 255, 255], tokens['blue-500'])).toBeGreaterThanOrEqual(3)
    })
  })
})
