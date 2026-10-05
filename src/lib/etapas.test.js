import { describe, expect, it } from 'vitest'
import { agruparPorUrgencia, etapasProcesso, grupoUrgencia, proximaAcao, quandoRelativo } from './etapas'
import { novoChecklistImport } from './processos'

// Sexta-feira, 2 out 2026, 10:00 (horário local).
const NOW = new Date(2026, 9, 2, 10, 0).getTime()
const em = (dias, h = 14) => {
  const d = new Date(2026, 9, 2 + dias, h, 0)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(h).padStart(2, '0')}:00`
}

const imp = (checklists, extra = {}) => ({
  id: 'i', type: 'import', status: 'active',
  containers: checklists.map((c, i) => ({ id: `c${i}`, checklist: { ...novoChecklistImport(), ...c } })),
  ...extra,
})
const exp = (containers) => ({ id: 'e', type: 'export', status: 'active', containers })
const tudoFeito = { ag_carga: em(-2), ag_carga_check: 'true', gerar_cte: 'true', gerar_ciot: 'true', gerar_mdfe: 'true', encerrar_mdfe: 'true', ag_vazio: em(-1), ag_vazio_check: 'true' }

describe('datas relativas', () => {
  it('fala hoje, amanhã, ontem e o dia da semana na semana que vem', () => {
    expect(quandoRelativo(em(0), NOW)).toBe('hoje 14:00')
    expect(quandoRelativo(em(1, 8), NOW)).toBe('amanhã 08:00')
    expect(quandoRelativo(em(-1), NOW)).toBe('ontem 14:00')
    expect(quandoRelativo(em(3), NOW)).toBe('seg 05/10 14:00')
    expect(quandoRelativo(em(10), NOW)).toBe('12/10 14:00')
    expect(quandoRelativo('', NOW)).toBeNull()
  })
})

describe('etapas do processo', () => {
  it('importação: conta quantos contêineres cumpriram cada etapa', () => {
    const etapas = etapasProcesso(imp([{ gerar_cte: 'true' }, {}]))
    expect(etapas).toHaveLength(6)
    expect(etapas.find((e) => e.id === 'gerar_cte')).toMatchObject({ feitos: 1, total: 2 })
  })

  it('exportação: retirada do vazio, estufagem e depósito do cheio (prazos não contam)', () => {
    const etapas = etapasProcesso(exp([{ deadlineDraft: em(5), agVazio: em(-1), agVazioCheck: 'true', estufagem: em(1) }]))
    expect(etapas.map((e) => e.label)).toEqual(['Retirada do vazio', 'Estufagem', 'Depósito do cheio'])
    expect(etapas.map((e) => e.feitos)).toEqual([1, 0, 0])
  })
})

describe('próxima ação', () => {
  it('pede contêiner quando não há nenhum', () => {
    expect(proximaAcao({ type: 'import', containers: [] }, NOW).texto).toBe('Adicionar contêiner')
  })

  it('importação: pede o agendamento e depois mostra quando é o carregamento', () => {
    expect(proximaAcao(imp([{}]), NOW)).toMatchObject({ texto: 'Agendar carregamento', tom: 'neutral' })
    expect(proximaAcao(imp([{ ag_carga: em(1) }]), NOW)).toMatchObject({ texto: 'Carregamento amanhã 14:00 · confirmar', tom: 'brand' })
    expect(proximaAcao(imp([{ ag_carga: em(0) }]), NOW).tom).toBe('warn')
    expect(proximaAcao(imp([{ ag_carga: em(-1) }]), NOW)).toMatchObject({ texto: 'Carregamento ontem 14:00 · confirmar', tom: 'danger' })
  })

  it('importação: segue para a próxima etapa e diz quantos contêineres faltam', () => {
    const feito = { ag_carga: em(-1), ag_carga_check: 'true' }
    expect(proximaAcao(imp([{ ...feito, gerar_cte: 'true' }, feito]), NOW).texto).toBe('Gerar CTe · falta 1 de 2')
  })

  it('tudo feito: pronto para arquivar', () => {
    expect(proximaAcao(imp([tudoFeito]), NOW).tom).toBe('success')
  })

  it('exportação: agendar, depois confirmar cada etapa na ordem', () => {
    expect(proximaAcao(exp([{ deadlineDraft: em(1, 8) }]), NOW).texto).toBe('Agendar retirada do vazio')
    expect(proximaAcao(exp([{ agVazio: em(1) }]), NOW)).toMatchObject({ texto: 'Retirada do vazio amanhã 14:00 · confirmar', tom: 'brand' })
    expect(proximaAcao(exp([{ agVazio: em(-1), agVazioCheck: 'true' }]), NOW).texto).toBe('Agendar estufagem')
    expect(proximaAcao(exp([{ agVazioCheck: 'true', estufagem: em(-1) }]), NOW).tom).toBe('danger')
  })
})

describe('grupos de urgência', () => {
  it('atrasado quando um agendamento ou Draft pendente já passou', () => {
    expect(grupoUrgencia(imp([{ ag_carga: em(-1) }]), NOW)).toBe('atrasados')
    expect(grupoUrgencia(exp([{ deadlineDraft: em(-1) }]), NOW)).toBe('atrasados')
  })

  it('Draft cumprido não atrasa', () => {
    expect(grupoUrgencia(exp([{ deadlineDraft: em(-1), numero: 'X', tara: '1', lacre: '2' }]), NOW)).toBe('semData')
  })

  it('separa por hoje, próximos 7 dias, mais adiante e sem data', () => {
    expect(grupoUrgencia(imp([{ ag_carga: em(0, 18) }]), NOW)).toBe('hoje')
    expect(grupoUrgencia(exp([{ agCheio: em(4) }]), NOW)).toBe('semana')
    expect(grupoUrgencia(exp([{ estufagem: em(20) }]), NOW)).toBe('adiante')
    expect(grupoUrgencia(exp([{ deadlineCarga: em(2) }]), NOW)).toBe('semData')
    expect(grupoUrgencia(imp([{}]), NOW)).toBe('semData')
  })

  it('concluído vai para prontos para arquivar', () => {
    expect(grupoUrgencia(imp([tudoFeito]), NOW)).toBe('prontos')
  })

  it('exportação: agendamento passado sem check atrasa; tudo marcado fica pronta', () => {
    expect(grupoUrgencia(exp([{ agVazio: em(-1) }]), NOW)).toBe('atrasados')
    const feito = { agVazioCheck: 'true', estufagemCheck: 'true', agCheioCheck: 'true' }
    expect(grupoUrgencia(exp([{ ...feito, deadlineCarga: em(5) }]), NOW)).toBe('prontos')
  })

  it('agrupa na ordem certa, mantendo a ordem dentro do grupo e sem grupos vazios', () => {
    const a = { ...imp([{}]), id: 'a' }
    const b = { ...imp([{ ag_carga: em(-1) }]), id: 'b' }
    const c = { ...imp([{}]), id: 'c' }
    const grupos = agruparPorUrgencia([a, b, c], NOW)
    expect(grupos.map((g) => g.id)).toEqual(['atrasados', 'semData'])
    expect(grupos[1].itens.map((p) => p.id)).toEqual(['a', 'c'])
  })
})
