// Regras de negócio dos processos, sem nada de tela — reaproveitadas pelos
// cards, pelo modal de detalhes, pelo resumo e pela exportação.

// CHECKLIST DE IMPORTAÇÃO (nesta ordem exata). Nas etapas "datetime" a data
// é só o agendamento (informativo) e o check "<id>_check" marca que o
// carregamento/devolução aconteceu de fato.
export const importChecklistSteps = [
  { id: 'ag_carga', label: 'Carregamento concluído', type: 'datetime' },
  { id: 'gerar_cte', label: 'Gerar CTe', type: 'checkbox' },
  { id: 'gerar_ciot', label: 'Gerar CIOT', type: 'checkbox' },
  { id: 'gerar_mdfe', label: 'Gerar MDFE', type: 'checkbox' },
  { id: 'encerrar_mdfe', label: 'Encerrar MDFE', type: 'checkbox' },
  { id: 'carga_entregue', label: 'Carga entregue', type: 'checkbox', so: 'baixa' },
  { id: 'ag_vazio', label: 'Devolução concluída', type: 'datetime', so: 'devolucao' },
]

// CARGA SOLTA (só importação): em vez de contêiner, uma carga descrita em
// texto (`proc.carga`, ex.: "104 caixas"). Por dentro continua com uma
// unidade em `containers`, que guarda o checklist, e segue as etapas da
// baixa (não há contêiner para devolver).
export const MODALIDADES = [
  { value: 'conteiner', label: 'Contêiner' },
  { value: 'solta', label: 'Carga solta' },
]
export const ehCargaSolta = (proc) => proc?.type === 'import' && proc?.modalidade === 'solta'

// Como a unidade aparece nas listas: número do contêiner ou a descrição da
// carga (sem descrição, só "Carga solta").
export const identificacaoUnidade = (proc, ct) =>
  ehCargaSolta(proc) ? (proc.carga || '').trim() || 'Carga solta' : (ct?.numero || '').trim()

// "Baixa de Contêiner" (sem devolução) não tem a etapa de devolução do vazio,
// mas tem a de carga entregue; a devolução é o contrário. Carga solta segue a
// baixa. Processos antigos sem finalizacaoVazio contam como "devolucao".
export const stepsChecklistImport = (proc) => {
  const finalizacao = proc?.finalizacaoVazio === 'baixa' || ehCargaSolta(proc) ? 'baixa' : 'devolucao'
  return importChecklistSteps.filter((step) => !step.so || step.so === finalizacao)
}

// Campo do checklist que marca a etapa como feita.
export const chaveEtapa = (step) => (step.type === 'checkbox' ? step.id : `${step.id}_check`)

// Contêineres de baixa de antes da etapa "Carga entregue" não têm o campo:
// para eles, MDFE encerrado conta como carga entregue.
const cargaEntregueAntiga = (checklist) => !('carga_entregue' in checklist) && checklist.encerrar_mdfe === 'true'

// Uma etapa do checklist de importação está feita neste contêiner?
export const etapaFeita = (ct, step) => {
  const checklist = ct.checklist || {}
  if (step.id === 'carga_entregue' && cargaEntregueAntiga(checklist)) return true
  return checklist[chaveEtapa(step)] === 'true'
}

// Na primeira gravação de um contêiner antigo, fixa o "Carga entregue" com o
// valor que ele já mostrava, para a regra acima não valer mais dali em diante.
export const fixarCargaEntregue = (checklist) =>
  'carga_entregue' in checklist ? checklist : { ...checklist, carga_entregue: cargaEntregueAntiga(checklist) ? 'true' : '' }

// Checklist "zerado" para um novo contêiner de importação. Etapas datetime
// ganham um campo extra "<id>_check" que marca a etapa como concluída.
export const novoChecklistImport = () => {
  const checklist = {}
  importChecklistSteps.forEach((step) => {
    checklist[step.id] = ''
    if (step.type === 'datetime') checklist[`${step.id}_check`] = ''
  })
  return checklist
}

// ETAPAS DA EXPORTAÇÃO (nesta ordem). Cada uma tem a data agendada (`id`)
// e o check (`check`) que marca que aconteceu de fato. Deadline Draft e
// Deadline Carga são só informativos e não contam como etapa.
export const exportSteps = [
  { id: 'agVazio', check: 'agVazioCheck', label: 'Retirada do vazio', feito: 'Vazio retirado', terminal: 'termVazioExp', cat: 'vazio' },
  { id: 'estufagem', check: 'estufagemCheck', label: 'Estufagem', feito: 'Estufagem concluída' },
  { id: 'agCheio', check: 'agCheioCheck', label: 'Depósito do cheio', feito: 'Cheio depositado', terminal: 'termCheioExp', cat: 'cheio' },
]

const pad = (n) => String(n).padStart(2, '0')

// "2026-09-20T14:30" -> "20/09/2026 14:30"
export const formatarDataHora = (valor) => {
  if (!valor) return '—'
  const data = new Date(valor)
  if (isNaN(data.getTime())) return '—'
  return `${pad(data.getDate())}/${pad(data.getMonth() + 1)}/${data.getFullYear()} ${pad(data.getHours())}:${pad(data.getMinutes())}`
}

// Versão compacta (sem ano) para os cards. null se não houver data válida.
export const formatarDataHoraCurta = (valor) => {
  if (!valor) return null
  const data = new Date(valor)
  if (isNaN(data.getTime())) return null
  return `${pad(data.getDate())}/${pad(data.getMonth() + 1)} ${pad(data.getHours())}:${pad(data.getMinutes())}`
}

// DÍGITO VERIFICADOR (ISO 6346): letras valem de 10 a 38, pulando múltiplos de 11.
const isoLetterValues = {}
{
  let v = 10
  for (const letra of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    while (v % 11 === 0) v++
    isoLetterValues[letra] = v++
  }
}

const calcularDigitoVerificador = (dezCaracteres) => {
  let soma = 0
  for (let i = 0; i < 10; i++) {
    const c = dezCaracteres[i]
    const valor = /[0-9]/.test(c) ? parseInt(c, 10) : isoLetterValues[c]
    soma += valor * Math.pow(2, i)
  }
  const resto = soma % 11
  return resto === 10 ? 0 : resto
}

// true/false quando os 11 caracteres já foram digitados; null se incompleto.
export const validarNumeroContainer = (valor) => {
  const clean = (valor || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  const letters = (clean.match(/[A-Z]/g) || []).join('')
  const digits = (clean.match(/[0-9]/g) || []).join('')
  if (letters.length !== 4 || digits.length !== 7) return null
  return calcularDigitoVerificador(letters + digits.slice(0, 6)) === parseInt(digits[6], 10)
}

// Formata no padrão "ABCD 123.456-7", aceitando colagem fora de ordem.
export const mascaraNumeroContainer = (valor) => {
  const clean = (valor || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  const letters = (clean.match(/[A-Z]/g) || []).slice(0, 4).join('')
  const digits = (clean.match(/[0-9]/g) || []).slice(0, 7).join('')
  let out = letters
  if (digits.length > 0) out += ' ' + digits.slice(0, 3)
  if (digits.length > 3) out += '.' + digits.slice(3, 6)
  if (digits.length > 6) out += '-' + digits.slice(6, 7)
  return out
}

// LEMBRETE DE DEADLINE DRAFT (só exportação)
export const draftAlertConfig = {
  aviso:    { icon: 'clock', iconColor: 'text-yellow-500', text: 'text-yellow-500', soft: 'bg-yellow-500/10', badge: 'bg-yellow-500/12 text-yellow-500', dot: 'bg-yellow-500' },
  atencao:  { icon: 'clock', iconColor: 'text-blue-500', text: 'text-blue-500', soft: 'bg-blue-500/8', badge: 'bg-blue-500/10 text-blue-500', dot: 'bg-blue-400' },
  urgente:  { icon: 'alert', iconColor: 'text-red-500', text: 'text-red-500', soft: 'bg-red-500/10', badge: 'bg-red-500/12 text-red-500', dot: 'bg-red-500' },
  atrasado: { icon: 'alert', iconColor: 'text-red-500', text: 'text-red-500', soft: 'bg-red-500/14', badge: 'bg-red-500 text-white', dot: 'bg-red-500' },
}

// Com Numeração, Tara e Lacre preenchidos o Draft já foi cumprido.
export const draftJaCumprido = (ct) =>
  !!((ct.numero || '').trim() && (ct.tara || '').trim() && (ct.lacre || '').trim())

// Aviso para o Deadline Draft mais próximo entre os contêineres pendentes:
// 3/2/1 dia(s) ou atrasado. null se não houver aviso.
export const getDraftDeadlineInfo = (proc, now = Date.now()) => {
  if (proc.type !== 'export' || proc.status !== 'active' || !proc.containers) return null

  let maisProxima = null
  proc.containers.forEach((ct) => {
    if (!ct.deadlineDraft || draftJaCumprido(ct)) return
    const data = new Date(ct.deadlineDraft)
    if (isNaN(data.getTime())) return
    if (!maisProxima || data < maisProxima) maisProxima = data
  })
  if (!maisProxima) return null

  const diffMs = maisProxima.getTime() - now
  if (diffMs <= 0) {
    const diasAtraso = Math.floor(-diffMs / 86400000)
    return {
      nivel: 'atrasado',
      texto: diasAtraso > 0 ? `Draft atrasado há ${diasAtraso} dia${diasAtraso > 1 ? 's' : ''}` : 'Draft venceu hoje',
    }
  }

  const diasRestantes = Math.ceil(diffMs / 86400000)
  if (diasRestantes > 3) return null
  const nivel = diasRestantes === 1 ? 'urgente' : diasRestantes === 2 ? 'atencao' : 'aviso'
  return { nivel, texto: `Draft vence em ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}` }
}

// Progresso 0-100: etapas concluídas (checks marcados) em todos os contêineres.
export const getProcessProgress = (proc) => {
  if (!proc.containers || proc.containers.length === 0) return 0
  let total = 0
  let done = 0

  if (proc.type === 'import') {
    const steps = stepsChecklistImport(proc)
    proc.containers.forEach((ct) => {
      steps.forEach((step) => {
        total++
        if (etapaFeita(ct, step)) done++
      })
    })
  } else {
    proc.containers.forEach((ct) => {
      exportSteps.forEach((step) => {
        total++
        if (ct[step.check] === 'true') done++
      })
    })
  }

  return total === 0 ? 0 : Math.round((done / total) * 100)
}

// Filtra pela aba (import/export/archive) e pela busca rápida.
export const filtrarProcessos = (processes, tab, searchQuery) => {
  let filtered = processes.filter((p) => {
    if (tab === 'archive') return p.status === 'archived'
    return p.status === 'active' && p.type === tab
  })

  const q = searchQuery.toLowerCase().trim()
  if (q) {
    filtered = filtered.filter((proc) => {
      const campos = [
        proc.armador, proc.motorista, proc.placas,
        proc.importador, proc.exportador,
        proc.documentoNumero, proc.documento, proc.booking, proc.referencia, proc.navio,
        proc.observacoes, proc.carga,
        ...(proc.containers || []).flatMap((c) => [c.numero, c.motorista, c.placas]),
      ].filter(Boolean).join(' ').toLowerCase()
      return campos.includes(q)
    })
  }

  return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export const DOC_TIPOS = [
  { value: 'DI', label: 'DI' },
  { value: 'DTA', label: 'DTA' },
  { value: 'DUIMP', label: 'DUIMP' },
]

export const DESTINOS = [
  { value: 'devolucao', label: 'Devolução' },
  { value: 'baixa', label: 'Baixa' },
]

// MOTORISTA E PLACAS POR CONTÊINER. Com um contêiner só, valem os campos do
// processo. Com mais de um, cada contêiner pode ter o seu motorista; quem
// ainda não tem usa o do processo (dados antigos continuam aparecendo).
export const transportePorContainer = (proc) => {
  const cts = proc.containers || []
  if (cts.length <= 1) {
    const ct = cts[0] || {}
    return [{ ctId: ct.id, numero: ct.numero || '', motorista: proc.motorista || ct.motorista || '', placas: proc.placas || ct.placas || '' }]
  }
  return cts.map((ct) => ({
    ctId: ct.id,
    numero: ct.numero || '',
    motorista: ct.motorista || proc.motorista || '',
    placas: ct.placas || proc.placas || '',
  }))
}

// A retirada do vazio precisa ser antes do Deadline Draft. true quando as
// duas datas existem e o vazio ficou para depois (ou na mesma hora).
export const vazioDepoisDoDraft = (agVazio, deadlineDraft) => {
  const vazio = new Date(agVazio || '').getTime()
  const draft = new Date(deadlineDraft || '').getTime()
  return !isNaN(vazio) && !isNaN(draft) && vazio >= draft
}

// Valores distintos e preenchidos (ex: os motoristas de um processo).
export const distintos = (valores) => [...new Set(valores.map((v) => (v || '').trim()).filter(Boolean))]

// Placas para exibição: "abc1d23" -> "ABC-1D23" (Mercosul) e "abc1234" ->
// "ABC-1234" (antiga). Funciona com várias placas no mesmo texto; o que não
// for placa fica como está. O valor salvo não muda.
export const formatarPlacas = (texto) =>
  (texto || '').replace(/\b([A-Za-z]{3})[-\s]?(\d[A-Za-z0-9]\d{2})\b/g, (_, l, n) => `${l.toUpperCase()}-${n.toUpperCase()}`)
