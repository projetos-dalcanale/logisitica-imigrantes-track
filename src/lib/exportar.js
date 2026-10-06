import { distintos, ehCargaSolta, formatarDataHora, identificacaoUnidade, transportePorContainer } from './processos'
import { montarHtmlProcesso } from './pdfProcesso'

// EXPORTAR PROCESSO EM PDF: a ficha com a identidade da empresa
// (pdfProcesso.js) vai para a área #print-area; o navegador abre a impressão
// e a pessoa escolhe "Salvar como PDF". Não precisa de biblioteca nem internet.
export const exportarProcessoPDF = (proc) => {
  document.getElementById('print-area').innerHTML = montarHtmlProcesso(proc)
  window.print()
}

// Célula de CSV: ";" como separador (padrão do Excel em português), com
// aspas quando o texto tiver ponto e vírgula, aspas ou quebra de linha.
const csvCell = (valor) => {
  const texto = valor === null || valor === undefined ? '' : String(valor)
  return /[;"\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

// EXPORTAÇÃO EM LOTE (CSV) da lista visível (aba + busca atuais).
export const exportarProcessosCSV = (lista, tab) => {
  const cabecalho = [
    'Tipo', 'Status', 'Armador', 'Motorista', 'Placas',
    'Importador/Exportador', 'Documento/Booking', 'Referência', 'Navio',
    'Terminal de Carregamento', 'Terminal de Vazio', 'Destino do Contêiner',
    'Contêineres', 'Qtd. Contêineres', 'Observações', 'Criado em',
  ]

  const linhas = lista.map((proc) => {
    const isImport = proc.type === 'import'
    const solta = ehCargaSolta(proc)
    const documento = isImport ? [proc.documentoTipo, proc.documentoNumero].filter(Boolean).join(' ') : proc.booking || ''
    const containersValidos = (proc.containers || []).filter((c) => c.numero)
    const transporte = transportePorContainer(proc)
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
      isImport && proc.finalizacaoVazio !== 'baixa' ? proc.termVazio || '' : '',
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
    ].map(csvCell).join(';')
  })

  // BOM no início faz o Excel em português reconhecer UTF-8 (acentos).
  const conteudo = '﻿' + [cabecalho.join(';'), ...linhas].join('\r\n')
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8;' }))
  const nomeAba = tab === 'archive' ? 'arquivados' : tab === 'import' ? 'importacoes' : 'exportacoes'
  const a = document.createElement('a')
  a.href = url
  a.download = `logitrack-${nomeAba}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
