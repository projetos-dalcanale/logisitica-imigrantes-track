import { describe, expect, it } from 'vitest'
import {
  filtrarProcessos,
  formatarDataHora,
  formatarDataHoraCurta,
  getDraftDeadlineInfo,
  getProcessProgress,
  mascaraNumeroContainer,
  novoChecklistImport,
  stepsChecklistImport,
  transportePorContainer,
  distintos,
  validarNumeroContainer,
  formatarPlacas,
  vazioDepoisDoDraft,
  etapaFeita,
  fixarCargaEntregue,
  importChecklistSteps,
} from './processos'

const DIA = 86400000
const AGORA = new Date('2026-10-02T12:00:00').getTime()
const dataLocal = (ms) => {
  const d = new Date(ms)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

describe('dígito verificador ISO 6346', () => {
  it('aceita um número válido, com ou sem máscara', () => {
    // Exemplo clássico da norma: CSQU 305438-3
    expect(validarNumeroContainer('CSQU3054383')).toBe(true)
    expect(validarNumeroContainer('CSQU 305.438-3')).toBe(true)
    expect(validarNumeroContainer('csqu3054383')).toBe(true)
  })

  it('recusa um dígito verificador errado', () => {
    expect(validarNumeroContainer('CSQU3054384')).toBe(false)
  })

  it('não avalia enquanto o número está incompleto', () => {
    expect(validarNumeroContainer('')).toBeNull()
    expect(validarNumeroContainer('CSQU305')).toBeNull()
    expect(validarNumeroContainer('CSQ 3054383')).toBeNull()
  })

  it('trata resto 10 como dígito 0', () => {
    // Procura um número cujo cálculo dê resto 10 e confere que "0" é aceito.
    let achou = null
    for (let n = 0; n < 2000 && !achou; n++) {
      const base = `ABCU${String(n).padStart(6, '0')}`
      const comZero = validarNumeroContainer(base + '0')
      const algumOutro = [1, 2, 3, 4, 5, 6, 7, 8, 9].some((d) => validarNumeroContainer(base + d))
      if (comZero && !algumOutro) achou = base
    }
    expect(achou).not.toBeNull()
  })
})

describe('máscara do número do contêiner', () => {
  it('formata como ABCD 123.456-7', () => {
    expect(mascaraNumeroContainer('csqu3054383')).toBe('CSQU 305.438-3')
  })
  it('formata parcialmente enquanto digita', () => {
    expect(mascaraNumeroContainer('CSQU')).toBe('CSQU')
    expect(mascaraNumeroContainer('CSQU30')).toBe('CSQU 30')
    expect(mascaraNumeroContainer('CSQU3054')).toBe('CSQU 305.4')
  })
  it('aceita colagem fora de ordem e corta o excesso', () => {
    expect(mascaraNumeroContainer('305 CSQU 438-3 99')).toBe('CSQU 305.438-3')
  })
})

describe('checklist de importação', () => {
  it('cria checklist zerado com os campos de confirmação dos agendamentos', () => {
    const c = novoChecklistImport()
    expect(c).toMatchObject({ ag_carga: '', ag_carga_check: '', gerar_cte: '', ag_vazio: '', ag_vazio_check: '' })
  })
  it('esconde o Agendamento de Vazio quando é baixa de contêiner', () => {
    expect(stepsChecklistImport({ finalizacaoVazio: 'baixa' }).map((s) => s.id)).not.toContain('ag_vazio')
    expect(stepsChecklistImport({}).map((s) => s.id)).toContain('ag_vazio')
  })
  it('na baixa, "Carga entregue" vem depois de Encerrar MDFE; na devolução não aparece', () => {
    const baixa = stepsChecklistImport({ finalizacaoVazio: 'baixa' }).map((s) => s.id)
    expect(baixa.slice(-2)).toEqual(['encerrar_mdfe', 'carga_entregue'])
    expect(stepsChecklistImport({}).map((s) => s.id)).not.toContain('carga_entregue')
  })
})

describe('carga entregue em contêineres antigos', () => {
  const passo = importChecklistSteps.find((s) => s.id === 'carga_entregue')

  it('sem o campo, MDFE encerrado conta como carga entregue', () => {
    expect(etapaFeita({ checklist: { encerrar_mdfe: 'true' } }, passo)).toBe(true)
    expect(etapaFeita({ checklist: { encerrar_mdfe: '' } }, passo)).toBe(false)
  })

  it('com o campo gravado, vale só o que foi marcado', () => {
    expect(etapaFeita({ checklist: { encerrar_mdfe: 'true', carga_entregue: '' } }, passo)).toBe(false)
    expect(etapaFeita({ checklist: { carga_entregue: 'true' } }, passo)).toBe(true)
    expect(etapaFeita({ checklist: novoChecklistImport() }, passo)).toBe(false)
  })

  it('a primeira gravação fixa o valor que o contêiner já mostrava', () => {
    expect(fixarCargaEntregue({ encerrar_mdfe: 'true' }).carga_entregue).toBe('true')
    expect(fixarCargaEntregue({ encerrar_mdfe: '' }).carga_entregue).toBe('')
    expect(fixarCargaEntregue({ carga_entregue: '' })).toEqual({ carga_entregue: '' })
  })
})

describe('progresso do processo', () => {
  it('é 0 sem contêineres', () => {
    expect(getProcessProgress({ type: 'import', containers: [] })).toBe(0)
  })

  it('importação: conta etapas marcadas e agendamentos confirmados', () => {
    const proc = {
      type: 'import',
      containers: [{ checklist: { ...novoChecklistImport(), gerar_cte: 'true', ag_carga_check: 'true', ag_carga: '2026-10-02T10:00' } }],
    }
    expect(getProcessProgress(proc)).toBe(33) // 2 de 6
  })

  it('importação com baixa: não conta o Agendamento de Vazio', () => {
    const checklist = { ag_carga_check: 'true', gerar_cte: 'true', gerar_ciot: 'true', gerar_mdfe: 'true', encerrar_mdfe: 'true' }
    expect(getProcessProgress({ type: 'import', finalizacaoVazio: 'baixa', containers: [{ checklist }] })).toBe(100)
    expect(getProcessProgress({ type: 'import', containers: [{ checklist }] })).toBe(83)
  })

  it('exportação: conta só as etapas marcadas (prazos são informativos)', () => {
    const ct = { deadlineDraft: 'x', deadlineCarga: 'x', agVazio: 'x', agVazioCheck: 'true', estufagem: 'x', agCheio: 'x' }
    expect(getProcessProgress({ type: 'export', containers: [ct] })).toBe(33)
    expect(getProcessProgress({ type: 'export', containers: [{ ...ct, estufagemCheck: 'true', agCheioCheck: 'true' }] })).toBe(100)
  })
})

describe('aviso de Deadline Draft', () => {
  const exp = (containers, extra = {}) => ({ type: 'export', status: 'active', containers, ...extra })

  it('avisa com 1, 2 e 3 dias de antecedência', () => {
    expect(getDraftDeadlineInfo(exp([{ deadlineDraft: dataLocal(AGORA + 0.5 * DIA) }]), AGORA)).toEqual({ nivel: 'urgente', texto: 'Draft vence em 1 dia' })
    expect(getDraftDeadlineInfo(exp([{ deadlineDraft: dataLocal(AGORA + 1.5 * DIA) }]), AGORA).nivel).toBe('atencao')
    expect(getDraftDeadlineInfo(exp([{ deadlineDraft: dataLocal(AGORA + 2.5 * DIA) }]), AGORA).nivel).toBe('aviso')
  })

  it('não avisa com mais de 3 dias', () => {
    expect(getDraftDeadlineInfo(exp([{ deadlineDraft: dataLocal(AGORA + 5 * DIA) }]), AGORA)).toBeNull()
  })

  it('marca atrasado e conta os dias', () => {
    expect(getDraftDeadlineInfo(exp([{ deadlineDraft: dataLocal(AGORA - 2.5 * DIA) }]), AGORA)).toEqual({ nivel: 'atrasado', texto: 'Draft atrasado há 2 dias' })
    expect(getDraftDeadlineInfo(exp([{ deadlineDraft: dataLocal(AGORA - 3600000) }]), AGORA).texto).toBe('Draft venceu hoje')
  })

  it('usa o prazo mais próximo entre os contêineres', () => {
    const info = getDraftDeadlineInfo(exp([{ deadlineDraft: dataLocal(AGORA + 2.5 * DIA) }, { deadlineDraft: dataLocal(AGORA + 0.5 * DIA) }]), AGORA)
    expect(info.nivel).toBe('urgente')
  })

  it('ignora contêiner com Draft cumprido (número, tara e lacre)', () => {
    const cumprido = { deadlineDraft: dataLocal(AGORA - DIA), numero: 'CSQU 305.438-3', tara: '3800', lacre: 'L1' }
    expect(getDraftDeadlineInfo(exp([cumprido]), AGORA)).toBeNull()
  })

  it('não avisa em importação nem em arquivados', () => {
    const c = [{ deadlineDraft: dataLocal(AGORA + 0.5 * DIA) }]
    expect(getDraftDeadlineInfo({ type: 'import', status: 'active', containers: c }, AGORA)).toBeNull()
    expect(getDraftDeadlineInfo(exp(c, { status: 'archived' }), AGORA)).toBeNull()
  })
})

describe('filtro e busca de processos', () => {
  const lista = [
    { id: 'a', type: 'import', status: 'active', createdAt: '2026-09-01', importador: 'PRIME MED', armador: 'CMA CGM', containers: [{ numero: 'CMAU 713.196-4' }] },
    { id: 'b', type: 'import', status: 'active', createdAt: '2026-09-20', importador: 'NOVA QUÍMICA', armador: 'MSC', containers: [] },
    { id: 'c', type: 'export', status: 'active', createdAt: '2026-09-10', exportador: 'BR BEAUTY', booking: '13565591', containers: [] },
    { id: 'd', type: 'import', status: 'archived', createdAt: '2026-08-01', importador: 'ANTIGO', containers: [] },
  ]

  it('separa por aba e ordena do mais novo para o mais antigo', () => {
    expect(filtrarProcessos(lista, 'import', '').map((p) => p.id)).toEqual(['b', 'a'])
    expect(filtrarProcessos(lista, 'export', '').map((p) => p.id)).toEqual(['c'])
    expect(filtrarProcessos(lista, 'archive', '').map((p) => p.id)).toEqual(['d'])
  })

  it('busca por armador, contêiner e booking, sem diferenciar maiúsculas', () => {
    expect(filtrarProcessos(lista, 'import', 'msc').map((p) => p.id)).toEqual(['b'])
    expect(filtrarProcessos(lista, 'import', 'cmau 713').map((p) => p.id)).toEqual(['a'])
    expect(filtrarProcessos(lista, 'export', '13565').map((p) => p.id)).toEqual(['c'])
  })
})

describe('retirada do vazio x Deadline Draft', () => {
  it('avisa quando o vazio fica depois (ou na mesma hora) do Draft', () => {
    expect(vazioDepoisDoDraft('2026-10-06T10:00', '2026-10-05T08:00')).toBe(true)
    expect(vazioDepoisDoDraft('2026-10-05T08:00', '2026-10-05T08:00')).toBe(true)
    expect(vazioDepoisDoDraft('2026-10-04T10:00', '2026-10-05T08:00')).toBe(false)
  })

  it('não avisa sem uma das datas', () => {
    expect(vazioDepoisDoDraft('2026-10-06T10:00', '')).toBe(false)
    expect(vazioDepoisDoDraft('', '2026-10-05T08:00')).toBe(false)
  })
})

describe('placas', () => {
  it('formata Mercosul e antiga com hífen, em maiúsculas', () => {
    expect(formatarPlacas('abc1d23')).toBe('ABC-1D23')
    expect(formatarPlacas('ABC 1234')).toBe('ABC-1234')
    expect(formatarPlacas('ABC-1D23')).toBe('ABC-1D23')
  })

  it('formata várias placas e não mexe no resto', () => {
    expect(formatarPlacas('ABC1D23 / XYZ9A87 (carreta)')).toBe('ABC-1D23 / XYZ-9A87 (carreta)')
    expect(formatarPlacas('a definir')).toBe('a definir')
    expect(formatarPlacas('')).toBe('')
  })
})

describe('datas', () => {
  it('formata data e hora no padrão brasileiro', () => {
    expect(formatarDataHora('2026-09-20T14:30')).toBe('20/09/2026 14:30')
    expect(formatarDataHoraCurta('2026-09-20T14:30')).toBe('20/09 14:30')
  })
  it('lida com valores vazios ou inválidos', () => {
    expect(formatarDataHora('')).toBe('—')
    expect(formatarDataHora('abc')).toBe('—')
    expect(formatarDataHoraCurta('')).toBeNull()
  })
})

describe('motorista e placas por contêiner', () => {
  it('com um contêiner, usa o motorista do processo', () => {
    const proc = { motorista: 'João', placas: 'ABC1D23', containers: [{ id: 'c1', numero: 'CSQU 305.438-3' }] }
    expect(transportePorContainer(proc)).toEqual([{ ctId: 'c1', numero: 'CSQU 305.438-3', motorista: 'João', placas: 'ABC1D23' }])
  })

  it('com vários contêineres, cada um tem o seu e os vazios herdam o do processo', () => {
    const proc = {
      motorista: 'João',
      placas: 'ABC1D23',
      containers: [
        { id: 'c1', numero: 'A', motorista: 'Carlos', placas: 'QWE4R56' },
        { id: 'c2', numero: 'B', motorista: '', placas: '' },
      ],
    }
    expect(transportePorContainer(proc).map((t) => [t.motorista, t.placas])).toEqual([
      ['Carlos', 'QWE4R56'],
      ['João', 'ABC1D23'],
    ])
  })

  it('processo sem contêiner ainda mostra o motorista do processo', () => {
    expect(transportePorContainer({ motorista: 'João', containers: [] })[0].motorista).toBe('João')
  })

  it('lista valores distintos, sem vazios', () => {
    expect(distintos(['João', ' João ', '', null, 'Carlos'])).toEqual(['João', 'Carlos'])
  })

  it('a busca encontra o motorista de um contêiner', () => {
    const lista = [{ id: 'x', type: 'import', status: 'active', createdAt: '2026-10-01', containers: [{ numero: 'A', motorista: 'Carlos Lima', placas: 'QWE4R56' }] }]
    expect(filtrarProcessos(lista, 'import', 'carlos').map((p) => p.id)).toEqual(['x'])
    expect(filtrarProcessos(lista, 'import', 'qwe4').map((p) => p.id)).toEqual(['x'])
  })
})
