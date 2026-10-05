// ETAPAS, PRÓXIMA AÇÃO E URGÊNCIA — o que os cards e a lista mostram para
// dizer "em que pé está" cada processo sem precisar abrir a ficha.
import { draftJaCumprido, getDraftDeadlineInfo, getProcessProgress, stepsChecklistImport } from './processos'

const pad = (n) => String(n).padStart(2, '0')
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const DIA_MS = 86400000

const inicioDoDia = (t) => {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

const dataValida = (valor) => {
  if (!valor) return null
  const t = new Date(valor).getTime()
  return isNaN(t) ? null : t
}

// "hoje 14:00", "amanhã 08:30", "ontem 10:00", "seg 06/10 14:00" (até 6 dias)
// ou "06/10 14:00". null sem data válida.
export const quandoRelativo = (valor, now = Date.now()) => {
  const t = dataValida(valor)
  if (t === null) return null
  const d = new Date(t)
  const hora = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  const dias = Math.round((inicioDoDia(t) - inicioDoDia(now)) / DIA_MS)
  if (dias === 0) return `hoje ${hora}`
  if (dias === 1) return `amanhã ${hora}`
  if (dias === -1) return `ontem ${hora}`
  const dia = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`
  if (dias > 1 && dias < 7) return `${DIAS[d.getDay()]} ${dia} ${hora}`
  return `${dia} ${hora}`
}

// Uma etapa do checklist de importação está feita neste contêiner?
export const etapaFeita = (ct, step) =>
  ct.checklist?.[step.type === 'checkbox' ? step.id : `${step.id}_check`] === 'true'

// Marcos da exportação em ordem cronológica (os campos que o progresso conta).
export const ETAPAS_EXPORT = [
  { id: 'agVazio', label: 'Retirada do vazio', acao: 'Agendar retirada do vazio' },
  { id: 'deadlineDraft', label: 'Deadline Draft', acao: 'Definir Deadline Draft' },
  { id: 'agCheio', label: 'Entrega do cheio', acao: 'Agendar entrega do cheio' },
  { id: 'deadlineCarga', label: 'Deadline Carga', acao: 'Definir Deadline Carga' },
]

// Nomes curtos dos agendamentos de importação para a próxima ação.
const AGENDAMENTOS_IMPORT = {
  ag_carga: { acao: 'Agendar carregamento', evento: 'Carregamento' },
  ag_vazio: { acao: 'Agendar devolução do vazio', evento: 'Devolução do vazio' },
}

// Etapas do processo com quantos contêineres já cumpriram cada uma.
export const etapasProcesso = (proc) => {
  const cts = proc.containers || []
  const etapas =
    proc.type === 'import'
      ? stepsChecklistImport(proc).map((step) => ({ id: step.id, label: step.label, feitos: cts.filter((ct) => etapaFeita(ct, step)).length }))
      : ETAPAS_EXPORT.map((e) => ({ id: e.id, label: e.label, feitos: cts.filter((ct) => !!ct[e.id]).length }))
  return etapas.map((e) => ({ ...e, total: cts.length }))
}

const sufixoContainers = (pendentes, total) => (total > 1 && pendentes < total ? ` · falta ${pendentes} de ${total}` : '')

// Pronto para arquivar? Importação: checklist completo. Exportação: tudo
// preenchido e todas as datas já passaram (entregou o cheio, passou a carga).
export const processoConcluido = (proc, now = Date.now()) => {
  const cts = proc.containers || []
  if (!cts.length || getProcessProgress(proc) !== 100) return false
  if (proc.type === 'import') return true
  return cts.every((ct) => ETAPAS_EXPORT.every((e) => (dataValida(ct[e.id]) ?? 0) <= now))
}

// O que precisa acontecer agora. tom: neutral | brand | warn | danger | success.
export const proximaAcao = (proc, now = Date.now()) => {
  const cts = proc.containers || []
  if (!cts.length) return { texto: 'Adicionar contêiner', tom: 'neutral' }
  if (processoConcluido(proc, now)) {
    return { texto: proc.status === 'archived' ? 'Concluído' : 'Tudo concluído · pronto para arquivar', tom: 'success' }
  }

  if (proc.type === 'import') {
    for (const step of stepsChecklistImport(proc)) {
      const pendentes = cts.filter((ct) => !etapaFeita(ct, step))
      if (!pendentes.length) continue
      const sufixo = sufixoContainers(pendentes.length, cts.length)
      if (step.type === 'checkbox') return { texto: step.label + sufixo, tom: 'neutral' }

      const nomes = AGENDAMENTOS_IMPORT[step.id] || { acao: step.label, evento: step.label }
      const datas = pendentes.map((ct) => dataValida(ct.checklist?.[step.id])).filter((t) => t !== null).sort((a, b) => a - b)
      if (!datas.length) return { texto: nomes.acao + sufixo, tom: 'neutral' }
      const t = datas[0]
      // Data na frente: no celular o texto é cortado no fim.
      const tom = t < now ? 'danger' : inicioDoDia(t) === inicioDoDia(now) ? 'warn' : 'brand'
      return { texto: `${nomes.evento} ${quandoRelativo(t, now)} · confirmar`, tom }
    }
  }

  // Exportação: primeiro o Draft que estiver para vencer, depois o que falta preencher.
  const draft = getDraftDeadlineInfo(proc, now)
  if (draft) {
    const prazo = cts
      .filter((ct) => ct.deadlineDraft && !draftJaCumprido(ct))
      .map((ct) => dataValida(ct.deadlineDraft))
      .filter((t) => t !== null)
      .sort((a, b) => a - b)[0]
    const tom = draft.nivel === 'aviso' ? 'warn' : draft.nivel === 'atencao' ? 'brand' : 'danger'
    return { texto: draft.nivel === 'atrasado' ? `Draft venceu ${quandoRelativo(prazo, now)}` : `Enviar Draft até ${quandoRelativo(prazo, now)}`, tom }
  }
  for (const etapa of ETAPAS_EXPORT) {
    const pendentes = cts.filter((ct) => !ct[etapa.id]).length
    if (pendentes) return { texto: etapa.acao + sufixoContainers(pendentes, cts.length), tom: 'neutral' }
  }
  // Tudo preenchido: mostra o próximo marco que ainda vai acontecer.
  const proximo = eventos(proc)
    .filter((e) => e.t !== null && e.t > now)
    .sort((a, b) => a.t - b.t)[0]
  if (proximo) return { texto: `${proximo.label} ${quandoRelativo(proximo.t, now)}`, tom: 'brand' }
  return { texto: 'Acompanhar prazos', tom: 'neutral' }
}

// Datas que contam para a urgência. `pendente` = ainda depende de alguém
// agir (se passar da hora, o processo está atrasado).
const eventos = (proc) => {
  const cts = proc.containers || []
  if (proc.type === 'import') {
    const steps = stepsChecklistImport(proc).filter((s) => s.type === 'datetime')
    return cts.flatMap((ct) => steps.map((s) => ({ t: dataValida(ct.checklist?.[s.id]), pendente: !etapaFeita(ct, s) })))
  }
  return cts.flatMap((ct) => [
    { t: dataValida(ct.deadlineDraft), pendente: !draftJaCumprido(ct), label: 'Deadline Draft' },
    { t: dataValida(ct.deadlineCarga), pendente: false, label: 'Deadline Carga' },
    { t: dataValida(ct.agVazio), pendente: false, label: 'Retirada do vazio' },
    { t: dataValida(ct.agCheio), pendente: false, label: 'Entrega do cheio' },
  ])
}

// Grupos da lista, na ordem em que aparecem.
export const GRUPOS = [
  { id: 'atrasados', label: 'Atrasados', tom: 'danger' },
  { id: 'hoje', label: 'Hoje', tom: 'warn' },
  { id: 'semana', label: 'Próximos 7 dias', tom: 'neutral' },
  { id: 'adiante', label: 'Mais adiante', tom: 'neutral' },
  { id: 'semData', label: 'Sem data marcada', tom: 'neutral' },
  { id: 'prontos', label: 'Prontos para arquivar', tom: 'success' },
]

export const grupoUrgencia = (proc, now = Date.now()) => {
  if (processoConcluido(proc, now)) return 'prontos'
  const evs = eventos(proc).filter((e) => e.t !== null)
  if (evs.some((e) => e.pendente && e.t < now)) return 'atrasados'
  const hoje = inicioDoDia(now)
  const proxima = evs.map((e) => e.t).filter((t) => t >= hoje).sort((a, b) => a - b)[0]
  if (proxima === undefined) return 'semData'
  const dias = Math.round((inicioDoDia(proxima) - hoje) / DIA_MS)
  return dias === 0 ? 'hoje' : dias <= 7 ? 'semana' : 'adiante'
}

// Separa a lista (já na ordem do usuário) nos grupos, sem os vazios.
export const agruparPorUrgencia = (processes, now = Date.now()) => {
  const porGrupo = new Map(GRUPOS.map((g) => [g.id, []]))
  processes.forEach((p) => porGrupo.get(grupoUrgencia(p, now)).push(p))
  return GRUPOS.map((g) => ({ ...g, itens: porGrupo.get(g.id) })).filter((g) => g.itens.length)
}
