import { describe, expect, it } from 'vitest'
import { totalFrete } from './fretes'

describe('total do frete', () => {
  it('soma os campos em reais', () => {
    expect(totalFrete([
      { label: 'Frete Peso', tipo: 'moeda', valor: 4000 },
      { label: 'Pedágio', tipo: 'moeda', valor: 250.5 },
      { label: 'Gris', valor: 49.5 },
    ])).toBe(4300)
  })

  it('deixa as taxas de fora', () => {
    expect(totalFrete([{ tipo: 'moeda', valor: 100 }, { tipo: 'taxa', valor: 0.0015 }])).toBe(100)
  })

  it('arredonda nos centavos e aguenta campo vazio', () => {
    expect(totalFrete([{ valor: 0.1 }, { valor: 0.2 }])).toBe(0.3)
    expect(totalFrete([{ valor: '' }, { valor: undefined }])).toBe(0)
    expect(totalFrete()).toBe(0)
  })
})
