// Regras de negócio dos processos, sem nada de tela — reaproveitadas pelos
// cards, pelo modal de detalhes, pelo resumo e pela exportação.

// CHECKLIST DE IMPORTAÇÃO (nesta ordem exata)
export const importChecklistSteps = [
  { id: 'ag_carga', label: 'Agendamento de Carregamento', type: 'datetime' },
  { id: 'gerar_cte', label: 'Gerar CTe', type: 'checkbox' },
  { id: 'gerar_ciot', label: 'Gerar CIOT', type: 'checkbox' },
  { id: 'gerar_mdfe', label: 'Gerar MDFE', type: 'checkbox' },
  { id: 'encerrar_mdfe', label: 'Encerrar MDFE', type: 'checkbox' },
  { id: 'ag_vazio', label: 'Agendamento de Vazio', type: 'datetime' },
]

// "Baixa de Contêiner" (sem devolução) não tem Agendamento de Vazio.
// Processos antigos sem finalizacaoVazio contam como "devolucao".
export const stepsChecklistImport = (proc) =>
  proc?.finalizacaoVazio === 'baixa'
    ? importChecklistSteps.filter((step) => step.id !== 'ag_vazio')
    : importChecklistSteps

// Checklist "zerado" para um novo contêiner de importação. Etapas datetime
// ganham um campo extra "<id>_check" que marca o agendamento como confirmado.
export const novoChecklistImport = () => {
  const checklist = {}
  importChecklistSteps.forEach((step) => {
    checklist[step.id] = ''
    if (step.type === 'datetime') checklist[`${step.id}_check`] = ''
  })
  return checklist
}

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

// Progresso 0-100. Importação: etapas do checklist concluídas.
// Exportação: campos de prazo/agendamento preenchidos.
export const getProcessProgress = (proc) => {
  if (!proc.containers || proc.containers.length === 0) return 0
  let total = 0
  let done = 0

  if (proc.type === 'import') {
    const steps = stepsChecklistImport(proc)
    proc.containers.forEach((ct) => {
      steps.forEach((step) => {
        total++
        const key = step.type === 'checkbox' ? step.id : `${step.id}_check`
        if (ct.checklist?.[key] === 'true') done++
      })
    })
  } else {
    const exportFields = ['deadlineDraft', 'deadlineCarga', 'agVazio', 'agCheio']
    proc.containers.forEach((ct) => {
      exportFields.forEach((f) => {
        total++
        if (ct[f]) done++
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
        proc.observacoes,
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

// Valores distintos e preenchidos (ex: os motoristas de um processo).
export const distintos = (valores) => [...new Set(valores.map((v) => (v || '').trim()).filter(Boolean))]
