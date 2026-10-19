import { describe, expect, it } from 'vitest'
import { comTempoLimite, montarPlanilha, nomeDaPlanilha } from './xlsx'

describe('tempo limite', () => {
  it('rejeita se a geração nunca termina (Worker bloqueado não pode deixar o app esperando)', async () => {
    await expect(comTempoLimite(new Promise(() => {}), 20)).rejects.toThrow(/demorou/i)
  })

  it('devolve o resultado quando termina a tempo', async () => {
    await expect(comTempoLimite(Promise.resolve(42), 1000)).resolves.toBe(42)
  })

  it('repassa o erro da própria geração', async () => {
    await expect(comTempoLimite(Promise.reject(new Error('falhou')), 1000)).rejects.toThrow('falhou')
  })
})

const tabela = {
  cabecalho: ['Cliente', 'Qtd.'],
  linhas: [['Agro Vale', 2], ['=1+1', 0], ['', 5]],
}

describe('planilha .xlsx', () => {
  it('primeira linha é o cabeçalho em negrito; as demais são os dados', () => {
    const { dados } = montarPlanilha(tabela)
    expect(dados).toHaveLength(4)
    expect(dados[0].map((c) => [c.value, c.fontWeight, c.type])).toEqual([['Cliente', 'bold', String], ['Qtd.', 'bold', String]])
  })

  it('texto vira célula de texto (formato @): "=1+1" não é fórmula e "00123" não vira número', () => {
    const { dados } = montarPlanilha(tabela)
    expect(dados[2][0]).toMatchObject({ type: String, value: '=1+1', format: '@' })
    expect(dados[3][0]).toMatchObject({ type: String, value: '', format: '@' })
  })

  it('número fica número', () => {
    const { dados } = montarPlanilha(tabela)
    expect(dados[1][1]).toMatchObject({ type: Number, value: 2 })
    expect(dados[1][1].format).toBeUndefined()
  })

  it('largura de cada coluna pelo maior conteúdo, entre 10 e 50 caracteres', () => {
    const longo = { cabecalho: ['A', 'B', 'C'], linhas: [['x', 'y'.repeat(30), 'z'.repeat(200)]] }
    expect(montarPlanilha(longo).colunas.map((c) => c.width)).toEqual([10, 32, 50])
  })

  it('tabela sem linhas ainda gera o cabeçalho', () => {
    expect(montarPlanilha({ cabecalho: ['A'], linhas: [] }).dados).toHaveLength(1)
  })

  it('nome da aba: sem caracteres proibidos e com até 31 letras', () => {
    expect(nomeDaPlanilha('Importações: 02/10 [lista]?')).toBe('Importações 02 10 lista')
    expect(nomeDaPlanilha('x'.repeat(40))).toHaveLength(31)
    expect(nomeDaPlanilha('')).toBe('LogiTrack')
  })
})
