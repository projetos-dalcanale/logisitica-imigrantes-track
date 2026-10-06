// ETAPAS, PRÓXIMA AÇÃO E URGÊNCIA — o que os cards e a lista mostram para
// dizer "em que pé está" cada processo sem precisar abrir a ficha.
import { draftJaCumprido, etapaFeita, exportSteps, getProcessProgress, identificacaoUnidade, stepsChecklistImport } from './processos'

export { etapaFeita }

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

// Nomes curtos dos agendamentos de importação para a próxima ação.
const AGENDAMENTOS_IMPORT = {
  ag_carga: { acao: 'Agendar carregamento', evento: 'Carregamento' },
  ag_vazio: { acao: 'Agendar devolução do vazio', evento: 'Devolução do vazio' },
}

// Etapas no mesmo formato para os dois tipos de processo: como ler a data
// agendada (só agendamentos) e se a etapa já foi feita num contêiner.
const passos = (proc) => {
  if (proc.type === 'import') {
    return stepsChecklistImport(proc).map((step) => ({
      id: step.id,
      label: step.label,
      agendamento: step.type === 'datetime',
      data: (ct) => ct.checklist?.[step.id],
      feita: (ct) => etapaFeita(ct, step),
      ...(AGENDAMENTOS_IMPORT[step.id] || { acao: step.label, evento: step.label }),
    }))
  }
  return exportSteps.map((step) => ({
    id: step.id,
    label: step.label,
    agendamento: true,
    data: (ct) => ct[step.id],
    feita: (ct) => ct[step.check] === 'true',
    acao: `Agendar ${step.label.toLowerCase()}`,
    evento: step.label,
  }))
}

// Etapas do processo com quantos contêineres já cumpriram cada uma.
export const etapasProcesso = (proc) => {
  const cts = proc.containers || []
  return passos(proc).map((p) => ({ id: p.id, label: p.label, feitos: cts.filter(p.feita).length, total: cts.length }))
}

const sufixoContainers = (pendentes, total) => (total > 1 && pendentes < total ? ` · falta ${pendentes} de ${total}` : '')

// Pronto para arquivar: todas as etapas marcadas em todos os contêineres.
export const processoConcluido = (proc) => (proc.containers || []).length > 0 && getProcessProgress(proc) === 100

// O que precisa acontecer agora. tom: neutral | brand | warn | danger | success.
export const proximaAcao = (proc, now = Date.now()) => {
  const cts = proc.containers || []
  if (!cts.length) return { texto: 'Adicionar contêiner', tom: 'neutral' }
  if (processoConcluido(proc)) {
    return { texto: proc.status === 'archived' ? 'Concluído' : 'Tudo concluído · pronto para arquivar', tom: 'success' }
  }

  for (const p of passos(proc)) {
    const pendentes = cts.filter((ct) => !p.feita(ct))
    if (!pendentes.length) continue
    const sufixo = sufixoContainers(pendentes.length, cts.length)
    if (!p.agendamento) return { texto: p.label + sufixo, tom: 'neutral' }

    const datas = pendentes.map((ct) => dataValida(p.data(ct))).filter((t) => t !== null).sort((a, b) => a - b)
    if (!datas.length) return { texto: p.acao + sufixo, tom: 'neutral' }
    const t = datas[0]
    // Data na frente: no celular o texto é cortado no fim.
    const tom = t < now ? 'danger' : inicioDoDia(t) === inicioDoDia(now) ? 'warn' : 'brand'
    return { texto: `${p.evento} ${quandoRelativo(t, now)} · confirmar`, tom }
  }
  return { texto: 'Acompanhar', tom: 'neutral' }
}

// Datas que contam para a urgência. `pendente` = ainda depende de alguém
// agir (se passar da hora, o processo está atrasado). Na exportação o
// Deadline Draft não cumprido também conta; o Deadline Carga é só informativo.
const eventos = (proc) => {
  const cts = proc.containers || []
  const agendamentos = passos(proc).filter((p) => p.agendamento)
  const lista = cts.flatMap((ct) => agendamentos.map((p) => ({ t: dataValida(p.data(ct)), pendente: !p.feita(ct) })))
  if (proc.type === 'export') cts.forEach((ct) => lista.push({ t: dataValida(ct.deadlineDraft), pendente: !draftJaCumprido(ct) }))
  return lista
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
  if (processoConcluido(proc)) return 'prontos'
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

// AGENDA (página inicial): compromissos datados de um processo, com nome,
// contêiner e se já foi feito. Na exportação entram também os prazos do
// armador (Deadline Draft pendente enquanto o Draft não for cumprido;
// Deadline Carga só informativo).
export const compromissos = (proc) => {
  const lista = []
  for (const ct of proc.containers || []) {
    for (const p of passos(proc).filter((x) => x.agendamento)) {
      const t = dataValida(p.data(ct))
      if (t !== null) lista.push({ t, rotulo: p.evento, numero: identificacaoUnidade(proc, ct), feito: p.feita(ct), pendente: !p.feita(ct) })
    }
    if (proc.type === 'export') {
      const draft = dataValida(ct.deadlineDraft)
      if (draft !== null) lista.push({ t: draft, rotulo: 'Deadline Draft', numero: ct.numero || '', feito: draftJaCumprido(ct), pendente: !draftJaCumprido(ct) })
      const carga = dataValida(ct.deadlineCarga)
      if (carga !== null) lista.push({ t: carga, rotulo: 'Deadline Carga', numero: ct.numero || '', feito: false, pendente: false })
    }
  }
  return lista
}

// Agenda dos processos ativos: atrasados (pendentes cujo horário passou),
// hoje e amanhã (o que ainda não foi feito), em ordem de horário.
export const agendaDoDia = (processes, now = Date.now()) => {
  const hoje = inicioDoDia(now)
  const amanha = hoje + DIA_MS
  const depois = amanha + DIA_MS
  const atrasados = []
  const deHoje = []
  const deAmanha = []
  for (const proc of processes) {
    if (proc.status !== 'active') continue
    for (const c of compromissos(proc)) {
      const item = { ...c, proc }
      if (c.pendente && c.t < now) atrasados.push(item)
      else if (c.feito) continue
      else if (c.t >= hoje && c.t < amanha) deHoje.push(item)
      else if (c.t >= amanha && c.t < depois) deAmanha.push(item)
    }
  }
  const porHora = (a, b) => a.t - b.t
  return { atrasados: atrasados.sort(porHora), hoje: deHoje.sort(porHora), amanha: deAmanha.sort(porHora) }
}
