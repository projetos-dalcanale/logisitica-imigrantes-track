// TABELA DE EXPORTAÇÃO: uma única montagem dos dados (cabeçalho + linhas) que
// alimenta o CSV e a cópia para o e-mail.
import { distintos, ehCargaSolta, formatarDataHora, identificacaoUnidade, terminaisDeDevolucao, transportePorContainer } from './processos'
import { proximaAcao, proximoPrazo } from './etapas'

// As 16 primeiras colunas são as do CSV de sempre (planilhas que já leem o
// arquivo continuam valendo); Próxima ação e Prazo vêm no fim.
const CABECALHO = [
  'Tipo', 'Status', 'Armador', 'Motorista', 'Placas',
  'Importador/Exportador', 'Documento/Booking', 'Referência', 'Navio',
  'Terminal de Carregamento', 'Terminal de Vazio', 'Destino do Contêiner',
  'Contêineres', 'Qtd. Contêineres', 'Observações', 'Criado em',
  'Próxima ação', 'Prazo',
]

const linhaDoProcesso = (proc, now) => {
  const isImport = proc.type === 'import'
  const solta = ehCargaSolta(proc)
  const documento = isImport ? [proc.documentoTipo, proc.documentoNumero].filter(Boolean).join(' ') : proc.booking || ''
  const containersValidos = (proc.containers || []).filter((c) => c.numero)
  const transporte = transportePorContainer(proc)
  const prazo = proximoPrazo(proc)
  return [
    isImport ? 'Importação' : 'Exportação',
    proc.status === 'archived' ? 'Arquivado' : 'Ativo',
    proc.armador || '',
    distintos(transporte.map((t) => t.motorista)).join(' | '),
    distintos(transporte.map((t) => t.placas)).join(' | '),
    isImport ? proc.importador || '' : proc.exportador || '',
    documento,
    proc.referencia || '',
    proc.navio || '',
    isImport ? proc.termCarga || '' : '',
    terminaisDeDevolucao(proc).join(' | '),
    solta ? 'Carga solta' : isImport ? (proc.finalizacaoVazio === 'baixa' ? 'Baixa de Contêiner' : 'Devolução de Vazio') : '',
    solta ? identificacaoUnidade(proc) : (proc.containers || [])
      .map((c, i) => {
        if (!c.numero) return null
        const base = c.tipo ? `${c.numero} (${c.tipo})` : c.numero
        // Com vários contêineres, mostra o motorista de cada um.
        const m = transporte.length > 1 && transporte[i].motorista
        return m ? `${base} - ${m}` : base
      })
      .filter(Boolean)
      .join(' | '),
    solta ? 0 : containersValidos.length,
    proc.observacoes || '',
    formatarDataHora(proc.createdAt),
    proximaAcao(proc, now).texto,
    prazo === null ? '' : formatarDataHora(prazo),
  ]
}

export const tabelaProcessos = (lista, now = Date.now()) => ({
  cabecalho: CABECALHO,
  linhas: lista.map((proc) => linhaDoProcesso(proc, now)),
})

// Planilhas tratam texto que começa com = + - @ como fórmula (nome de cliente
// "=1+1" viraria conta). O apóstrofo na frente deixa como texto.
export const neutralizarFormula = (texto) => (/^[=+\-@]/.test(texto) ? `'${texto}` : texto)

// Célula de CSV: ";" como separador (padrão do Excel em português), com
// aspas quando o texto tiver ponto e vírgula, aspas ou quebra de linha.
export const csvCell = (valor) => {
  if (typeof valor === 'number') return String(valor)
  const texto = neutralizarFormula(valor === null || valor === undefined ? '' : String(valor))
  return /[;"\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}
