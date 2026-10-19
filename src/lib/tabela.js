// MODO TABELA DA LISTA: transforma cada processo numa linha (texto já pronto
// para mostrar e para ordenar) e ordena as linhas por coluna.
import { distintos, formatarPlacas, identificacaoUnidade, ehCargaSolta, transportePorContainer } from './processos'
import { etapasProcesso, grupoUrgencia, proximaAcao, proximoPrazo } from './etapas'

export const COLUNAS = [
  { id: 'cliente', label: 'Cliente', ordenavel: true },
  { id: 'documento', label: 'Documento', ordenavel: true },
  { id: 'conteiner', label: 'Contêiner', ordenavel: true },
  { id: 'armador', label: 'Armador', ordenavel: true },
  { id: 'transporte', label: 'Motorista · Placa', ordenavel: true },
  { id: 'etapas', label: 'Etapas', ordenavel: true },
  { id: 'acao', label: 'Próxima ação', ordenavel: true },
  { id: 'prazo', label: 'Prazo', ordenavel: true },
]

const texto = (v) => (v || '').trim()

export const linhaDaTabela = (proc, now = Date.now()) => {
  const isImport = proc.type === 'import'
  const cts = proc.containers || []
  const numeros = cts.map((c) => texto(c.numero)).filter(Boolean)
  let conteiner = ''
  if (ehCargaSolta(proc)) conteiner = identificacaoUnidade(proc)
  else if (numeros.length) conteiner = numeros.length > 1 ? `${numeros[0]} +${numeros.length - 1}` : numeros[0]

  const transporte = transportePorContainer(proc)
  const motoristas = distintos(transporte.map((t) => t.motorista))
  const placas = distintos(transporte.map((t) => formatarPlacas(t.placas)))
  const etapas = etapasProcesso(proc)

  let documento = ''
  if (isImport) documento = proc.documentoTipo ? `${proc.documentoTipo} ${proc.documentoNumero || ''}`.trim() : texto(proc.documento)
  else if (texto(proc.booking)) documento = `Booking ${texto(proc.booking)}`

  return {
    id: proc.id,
    tipo: proc.type,
    cliente: texto(isImport ? proc.importador : proc.exportador),
    documento,
    conteiner,
    armador: texto(proc.armador),
    transporte: [motoristas.join(', '), placas.join(', ')].filter(Boolean).join(' · '),
    etapasFeitas: etapas.reduce((s, e) => s + e.feitos, 0),
    etapasTotal: etapas.reduce((s, e) => s + e.total, 0),
    acao: proximaAcao(proc, now),
    prazo: proximoPrazo(proc),
    grupo: grupoUrgencia(proc, now),
  }
}

const collator = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' })

// Valor de ordenação da coluna; null/'' = vazio (vai sempre para o fim).
const chave = (l, coluna) => {
  if (coluna === 'etapas') return l.etapasTotal ? l.etapasFeitas / l.etapasTotal : null
  if (coluna === 'prazo') return l.prazo
  if (coluna === 'acao') return l.acao.texto || null
  return l[coluna] || null
}

// Ordena (sem alterar a lista recebida). Estável: empates ficam na ordem de
// entrada, também no sentido decrescente.
export const ordenarLinhas = (linhas, coluna, direcao = 'asc') => {
  const sinal = direcao === 'desc' ? -1 : 1
  return linhas
    .map((l, i) => ({ l, i, k: chave(l, coluna) }))
    .sort((a, b) => {
      if (a.k === null && b.k === null) return a.i - b.i
      if (a.k === null) return 1
      if (b.k === null) return -1
      const c = typeof a.k === 'number' ? a.k - b.k : collator.compare(a.k, b.k)
      return c === 0 ? a.i - b.i : c * sinal
    })
    .map((x) => x.l)
}
