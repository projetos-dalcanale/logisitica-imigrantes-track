// PLANILHA .XLSX da tabela de exportação. A biblioteca (write-excel-file) só é
// baixada quando alguém pede o Excel; o resto do app não paga esse peso.

// Aba do Excel: até 31 caracteres e sem  [ ] : * ? / \
export const nomeDaPlanilha = (nome) => {
  const limpo = String(nome || '').replace(/[[\]:*?/\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 31).trim()
  return limpo || 'LogiTrack'
}

const LARGURA_MIN = 10
const LARGURA_MAX = 50

// Dados no formato da biblioteca + largura de cada coluna pelo maior conteúdo.
// Texto é sempre célula de texto (formato "@"): "=1+1" não vira conta e
// "00123" não vira número.
export const montarPlanilha = ({ cabecalho, linhas }) => {
  const dados = [
    cabecalho.map((c) => ({ type: String, value: c, fontWeight: 'bold', backgroundColor: '#F2F2F4' })),
    ...linhas.map((l) => l.map((v) => (typeof v === 'number' ? { type: Number, value: v } : { type: String, value: String(v ?? ''), format: '@' }))),
  ]
  const colunas = cabecalho.map((c, i) => {
    const maior = Math.max(String(c).length, ...linhas.map((l) => String(l[i] ?? '').length))
    return { width: Math.min(LARGURA_MAX, Math.max(LARGURA_MIN, maior + 2)) }
  })
  return { dados, colunas }
}

export const gerarXlsx = async (tabela, { nomePlanilha } = {}) => {
  const { default: escreverXlsx } = await import('write-excel-file/browser')
  const { dados, colunas } = montarPlanilha(tabela)
  return escreverXlsx(dados, { sheet: nomeDaPlanilha(nomePlanilha), columns: colunas, stickyRowsCount: 1 }).toBlob()
}
