import { describe, expect, it } from 'vitest'
import { gravarPreferencia, lerPreferencia } from './preferencias'

// Imita o localStorage.
const armazem = (inicial = {}) => {
  const dados = { ...inicial }
  return {
    dados,
    getItem: (k) => (k in dados ? dados[k] : null),
    setItem: (k, v) => { dados[k] = String(v) },
  }
}

describe('preferências de tela', () => {
  it('devolve o padrão quando não há nada salvo', () => {
    expect(lerPreferencia('x', 'cartoes', armazem())).toBe('cartoes')
  })

  it('guarda e lê objetos e textos', () => {
    const s = armazem()
    gravarPreferencia('secoes', { transporte: false }, s)
    gravarPreferencia('modo', 'tabela', s)
    expect(lerPreferencia('secoes', {}, s)).toEqual({ transporte: false })
    expect(lerPreferencia('modo', 'cartoes', s)).toBe('tabela')
  })

  it('JSON quebrado volta ao padrão em vez de lançar', () => {
    expect(lerPreferencia('x', 'padrao', armazem({ x: '{quebrado' }))).toBe('padrao')
  })

  it('storage ausente ou que lança não derruba a tela', () => {
    const quebrado = { getItem: () => { throw new Error('bloqueado') }, setItem: () => { throw new Error('bloqueado') } }
    expect(lerPreferencia('x', 'padrao', quebrado)).toBe('padrao')
    expect(() => gravarPreferencia('x', 1, quebrado)).not.toThrow()
    expect(lerPreferencia('x', 'padrao', null)).toBe('padrao')
    expect(() => gravarPreferencia('x', 1, null)).not.toThrow()
  })
})
