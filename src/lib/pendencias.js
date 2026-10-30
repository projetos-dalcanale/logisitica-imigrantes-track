// PENDÊNCIAS: tarefas do dia a dia da equipe (ex.: "encerrar MDF-e do motorista
// X"). Cada uma tem um título, um dia (AAAA-MM-DD, no fuso local, sem horário) e,
// se quiser, um processo vinculado. Aqui ficam só as regras, sem tela nem
// Firestore (as gravações estão em pendenciasDb.js).
import { dadosDoProcesso } from './status'

// Quantos dias uma pendência feita continua aparecendo em "Feitas recentemente".
export const DIAS_FEITAS = 7
const TITULO_MAX = 200
const DIA_MS = 86400000
const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

const pad = (n) => String(n).padStart(2, '0')

// Dia (AAAA-MM-DD) do fuso local; nunca derivado de UTC.
export const diaLocal = (now = Date.now()) => {
  const d = new Date(now)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// "AAAA-MM-DD" -> Date à meia-noite local (null se o dia não existe).
const paraData = (dia) => {
  if (typeof dia !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dia)) return null
  const [a, m, d] = dia.split('-').map(Number)
  const data = new Date(a, m - 1, d)
  return data.getFullYear() === a && data.getMonth() === m - 1 && data.getDate() === d ? data : null
}

const somarDias = (dia, n) => {
  const d = paraData(dia)
  d.setDate(d.getDate() + n)
  return diaLocal(d.getTime())
}

export const novaPendencia = (now = Date.now()) => ({
  titulo: '', data: diaLocal(now), feito: false, feitoEm: null, feitoPor: null, processoId: null, processoRotulo: null,
})

// Mensagem de erro ou null. O título é contado sem os espaços das pontas
// (é assim que é gravado) e a regra do Firestore também limita a 200.
export const validarPendencia = ({ titulo, data }) => {
  const t = String(titulo || '').trim()
  if (!t) return 'Escreva o que precisa ser feito.'
  if (t.length > TITULO_MAX) return `O título pode ter no máximo ${TITULO_MAX} caracteres.`
  if (!paraData(data)) return 'Escolha um dia válido.'
  return null
}

const porDiaECriacao = (a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : String(a.createdAt || '').localeCompare(String(b.createdAt || '')))

// Agrupa as pendências para a tela e para o Início. Atrasada = não feita com
// dia anterior a hoje (a de hoje NÃO é atrasada). Feitas: só as dos últimos
// DIAS_FEITAS dias, da mais recente para a mais antiga.
export const agendaPendencias = (lista, now = Date.now()) => {
  const hoje = diaLocal(now)
  const amanha = somarDias(hoje, 1)
  const limite = new Date(now)
  limite.setDate(limite.getDate() - DIAS_FEITAS)
  const desde = limite.getTime()

  const abertas = lista.filter((x) => !x.feito).sort(porDiaECriacao)
  const feitas = lista
    .filter((x) => x.feito && x.feitoEm && new Date(x.feitoEm).getTime() >= desde)
    .sort((a, b) => new Date(b.feitoEm).getTime() - new Date(a.feitoEm).getTime())
  return {
    atrasadas: abertas.filter((x) => x.data < hoje),
    hoje: abertas.filter((x) => x.data === hoje),
    amanha: abertas.filter((x) => x.data === amanha),
    proximas: abertas.filter((x) => x.data > amanha),
    feitas,
  }
}

// "hoje", "amanhã", "ontem", "há 3 dias", "seg 26/10" (até 6 dias) ou "30/11".
export const quandoDia = (data, now = Date.now()) => {
  const alvo = paraData(data)
  if (!alvo) return ''
  const base = new Date(now)
  base.setHours(0, 0, 0, 0)
  const dias = Math.round((alvo.getTime() - base.getTime()) / DIA_MS)
  if (dias === 0) return 'hoje'
  if (dias === 1) return 'amanhã'
  if (dias === -1) return 'ontem'
  if (dias < -1) return `há ${-dias} dias`
  const dm = `${pad(alvo.getDate())}/${pad(alvo.getMonth() + 1)}`
  return dias < 7 ? `${DIAS_SEMANA[alvo.getDay()]} ${dm}` : dm
}

// Texto que identifica o processo numa pendência: cliente e documento (ou, sem
// documento, os contêineres).
export const rotuloProcesso = (proc) => {
  const { cliente, documento, containers } = dadosDoProcesso(proc)
  const detalhe = documento ? `${documento.rotulo} ${documento.numero}` : containers.join(', ')
  return [cliente || 'Sem nome', detalhe].filter(Boolean).join(' · ')
}

// Processos ativos para escolher no vínculo, em ordem alfabética; rótulo
// repetido ganha (2), (3) na ordem do id (estável entre aberturas).
export const opcoesDeProcesso = (processes) => {
  const usados = new Map()
  return processes
    .filter((proc) => proc.status === 'active')
    .map((proc) => ({ id: proc.id, base: rotuloProcesso(proc) }))
    .sort((a, b) => a.base.localeCompare(b.base, 'pt-BR') || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map(({ id, base }) => {
      const n = (usados.get(base) || 0) + 1
      usados.set(base, n)
      return { id, rotulo: n === 1 ? base : `${base} (${n})` }
    })
}

// Rótulo que a edição mostra para o vínculo gravado: o atual do processo (achado
// pelo id, mesmo que o cliente ou o documento tenham mudado) ou, se ele não está
// mais na lista (arquivado, excluído), o texto gravado.
export const rotuloDoVinculo = ({ processoId, processoRotulo }, opcoes) =>
  opcoes.find((o) => o.id === processoId)?.rotulo || processoRotulo || ''

// Vínculo a gravar na edição. `rotulo` null = a pessoa não mexeu no campo: o
// mesmo processo (pelo id), com o rótulo atualizado. Vazio: sem vínculo. Um
// rótulo da lista: aquele processo. O texto gravado de um processo que saiu da
// lista: mantém o vínculo como estava.
export const vinculoEscolhido = (pendencia, opcoes, rotulo) => {
  const gravado = { processoId: pendencia.processoId || null, processoRotulo: pendencia.processoRotulo || null }
  if (rotulo === null) return gravado.processoId || gravado.processoRotulo ? { ...gravado, processoRotulo: rotuloDoVinculo(pendencia, opcoes) || null } : gravado
  if (!rotulo) return { processoId: null, processoRotulo: null }
  const escolhido = opcoes.find((o) => o.rotulo === rotulo)
  return escolhido ? { processoId: escolhido.id, processoRotulo: escolhido.rotulo } : gravado
}
