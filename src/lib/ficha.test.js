import { describe, expect, it } from 'vitest'
import { resumoContainer, secoesDaFicha } from './ficha'
import { novoChecklistImport } from './processos'

const imp = (n, extra = {}) => ({
  id: 'i', type: 'import', status: 'active',
  containers: Array.from({ length: n }, (_, i) => ({ id: `c${i + 1}`, numero: i === 0 ? 'MSCU 123.456-6' : '', checklist: novoChecklistImport() })),
  ...extra,
})
const exp = (n) => ({ id: 'e', type: 'export', status: 'active', containers: Array.from({ length: n }, (_, i) => ({ id: `c${i + 1}`, checklist: {} })) })

describe('seções da ficha', () => {
  it('importação com 1 contêiner: transporte e agendamentos no processo', () => {
    expect(secoesDaFicha(imp(1)).map((s) => s.id)).toEqual(['detalhes', 'transporte', 'agendamentos', 'observacoes', 'conteiner-c1'])
  })

  it('com 2 contêineres, transporte e agendamentos vão para dentro de cada um', () => {
    const secoes = secoesDaFicha(imp(2))
    expect(secoes.map((s) => s.id)).toEqual(['detalhes', 'observacoes', 'conteiner-c1', 'conteiner-c2'])
    expect(secoes.filter((s) => s.kind === 'conteiner').map((s) => s.label)).toEqual(['Contêiner 1', 'Contêiner 2'])
  })

  it('exportação não tem agendamentos no processo', () => {
    expect(secoesDaFicha(exp(1)).map((s) => s.id)).toEqual(['detalhes', 'transporte', 'observacoes', 'conteiner-c1'])
  })

  it('carga solta chama a unidade de "Carga solta"', () => {
    const secoes = secoesDaFicha(imp(1, { modalidade: 'solta' }))
    expect(secoes.at(-1)).toMatchObject({ kind: 'conteiner', label: 'Carga solta' })
  })

  it('processo sem contêiner só tem as seções do processo', () => {
    expect(secoesDaFicha(imp(0)).map((s) => s.id)).toEqual(['detalhes', 'transporte', 'observacoes'])
  })

  it('rótulos e tipos das seções fixas', () => {
    const secoes = secoesDaFicha(imp(1))
    expect(secoes.slice(0, 4).map((s) => [s.kind, s.label])).toEqual([
      ['detalhes', 'Detalhes'], ['transporte', 'Transporte'], ['agendamentos', 'Agendamentos'], ['observacoes', 'Observações'],
    ])
  })
})

describe('resumo do contêiner', () => {
  it('mostra o número e quantas etapas foram feitas', () => {
    const proc = imp(2)
    proc.containers[0].checklist.gerar_cte = 'true'
    proc.containers[0].checklist.gerar_ciot = 'true'
    expect(resumoContainer(proc, proc.containers[0], 0)).toBe('MSCU 123.456-6 · 2 de 6 etapas')
  })

  it('sem número usa "Contêiner N"', () => {
    const proc = imp(2)
    expect(resumoContainer(proc, proc.containers[1], 1)).toBe('Contêiner 2 · 0 de 6 etapas')
  })

  it('exportação conta as 3 etapas', () => {
    const proc = exp(1)
    proc.containers[0].agVazioCheck = 'true'
    expect(resumoContainer(proc, proc.containers[0], 0)).toBe('Contêiner 1 · 1 de 3 etapas')
  })
})
