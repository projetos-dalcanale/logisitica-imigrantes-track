import { describe, expect, it } from 'vitest'
import { agendaDoDia, grupoUrgencia, processoConcluido } from '../../src/lib/etapas'
import { getDraftDeadlineInfo, validarNumeroContainer } from '../../src/lib/processos'
import { FRETES, PEDAGIOS, gerarArquivados, gerarProcessos } from './dados-demo.mjs'

// Quarta-feira, 10h, horário local: os compromissos "de hoje" são à tarde.
const AGORA = new Date(2026, 9, 14, 10, 0, 0)
const ativos = gerarProcessos('uid-demo', AGORA)
const arquivados = gerarArquivados('uid-demo', AGORA)
const todos = [...ativos, ...arquivados]

describe('dados fictícios da instância modelo', () => {
  it('ids únicos e dono definido em todos os processos', () => {
    const ids = todos.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    todos.forEach((p) => expect(p.userId).toBe('uid-demo'))
  })

  it('respeita as regras do Firestore: tipo válido e criação sempre como ativo', () => {
    todos.forEach((p) => expect(['import', 'export']).toContain(p.type))
    ativos.forEach((p) => expect(p.status).toBe('active'))
    arquivados.forEach((p) => expect(p.status).toBe('archived'))
  })

  it('todo contêiner informado tem número válido (dígito verificador ISO 6346)', () => {
    const numeros = todos.flatMap((p) => p.containers.map((c) => c.numero)).filter(Boolean)
    expect(numeros.length).toBeGreaterThan(10)
    numeros.forEach((n) => expect(validarNumeroContainer(n), n).toBe(true))
  })

  it('a Início tem atrasados, compromissos de hoje e de amanhã', () => {
    const agenda = agendaDoDia(ativos, AGORA.getTime())
    expect(agenda.atrasados.length).toBeGreaterThan(0)
    expect(agenda.hoje.length).toBeGreaterThan(0)
    expect(agenda.amanha.length).toBeGreaterThan(0)
  })

  it('a lista mostra pelo menos atrasados, hoje e prontos para arquivar', () => {
    const grupos = new Set(ativos.map((p) => grupoUrgencia(p, AGORA.getTime())))
    ;['atrasados', 'hoje', 'prontos'].forEach((g) => expect(grupos, g).toContain(g))
    expect(ativos.filter(processoConcluido).length).toBeGreaterThanOrEqual(2)
  })

  it('cobre os casos de exportação: Draft a vencer e Draft atrasado', () => {
    const niveis = ativos.map((p) => getDraftDeadlineInfo(p, AGORA.getTime())?.nivel).filter(Boolean)
    expect(niveis).toContain('urgente')
    expect(niveis).toContain('atrasado')
  })

  it('cobre importação com devolução, baixa e carga solta', () => {
    const imports = ativos.filter((p) => p.type === 'import')
    expect(imports.some((p) => p.finalizacaoVazio === 'devolucao')).toBe(true)
    expect(imports.some((p) => p.finalizacaoVazio === 'baixa')).toBe(true)
    expect(imports.some((p) => p.modalidade === 'solta')).toBe(true)
    expect(imports.some((p) => p.containers.length > 1 && p.containers.some((c) => c.motorista))).toBe(true)
  })

  it('fretes e pedágios satisfazem as regras de gravação', () => {
    FRETES.forEach((f) => {
      expect(typeof f.cliente).toBe('string')
      expect(f.cliente.length).toBeGreaterThan(0)
      expect(Array.isArray(f.campos)).toBe(true)
    })
    PEDAGIOS.forEach((p) => {
      expect(p.origem.length).toBeGreaterThan(0)
      expect(p.destino.length).toBeGreaterThan(0)
    })
  })

  it('não carrega nome de empresa, pessoa ou valor reais do cliente de produção', () => {
    const texto = JSON.stringify([todos, FRETES, PEDAGIOS])
    expect(texto).not.toMatch(/imigrantes/i)
  })
})
