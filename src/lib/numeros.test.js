import { describe, expect, it } from 'vitest'
import { digitosParaNumero, formatarNumero } from './numeros'

describe('números no padrão brasileiro', () => {
  it('formata com separador de milhar e vírgula decimal', () => {
    expect(formatarNumero(2850)).toBe('2.850,00')
    expect(formatarNumero(145.8)).toBe('145,80')
    expect(formatarNumero(0.00125, 5)).toBe('0,00125')
    expect(formatarNumero(undefined)).toBe('0,00')
  })

  it('digitação: a vírgula anda sozinha', () => {
    expect(digitosParaNumero('1')).toBe(0.01)
    expect(digitosParaNumero('12')).toBe(0.12)
    expect(digitosParaNumero('12345')).toBe(123.45)
    expect(digitosParaNumero('125', 5)).toBe(0.00125)
  })

  it('digitação: ignora o que não é dígito e zeros à esquerda', () => {
    expect(digitosParaNumero('2.850,001')).toBe(28500.01)
    expect(digitosParaNumero('0,00')).toBe(0)
    expect(digitosParaNumero('')).toBe(0)
  })

  it('apagar o último dígito volta uma casa', () => {
    // O campo mostra "123,45"; apagando o 5 fica "123,4" → 12,34
    expect(digitosParaNumero('123,4')).toBe(12.34)
  })
})
