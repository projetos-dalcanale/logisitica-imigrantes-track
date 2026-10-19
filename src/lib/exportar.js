import { montarHtmlProcesso } from './pdfProcesso'
import { copiarTabela } from './copiarTabela'
import { csvCell, tabelaProcessos } from './tabelaExportacao'

// EXPORTAR PROCESSO EM PDF: a ficha com a identidade da empresa
// (pdfProcesso.js) vai para a área #print-area; o navegador abre a impressão
// e a pessoa escolhe "Salvar como PDF". Não precisa de biblioteca nem internet.
export const exportarProcessoPDF = (proc) => {
  document.getElementById('print-area').innerHTML = montarHtmlProcesso(proc)
  window.print()
}

const NOMES_ABA = { archive: 'arquivados', import: 'importacoes', export: 'exportacoes' }
const nomeAba = (tab) => NOMES_ABA[tab] || 'exportacoes'
const dataDeHoje = () => new Date().toISOString().slice(0, 10)

// Baixa um arquivo gerado no navegador.
const baixar = (blob, nome) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// EXPORTAÇÃO EM LOTE da lista (ou da seleção): as duas saídas (CSV e cópia) usam a mesma
// tabela (lib/tabelaExportacao.js).
export const exportarProcessosCSV = (lista, tab) => {
  const { cabecalho, linhas } = tabelaProcessos(lista)
  // BOM no início faz o Excel em português reconhecer UTF-8 (acentos).
  const conteudo = '﻿' + [cabecalho.map(csvCell).join(';'), ...linhas.map((l) => l.map(csvCell).join(';'))].join('\r\n')
  baixar(new Blob([conteudo], { type: 'text/csv;charset=utf-8;' }), `logitrack-${nomeAba(tab)}-${dataDeHoje()}.csv`)
}

// Tabela na área de transferência, para colar no e-mail (Outlook) ou no Excel.
export const copiarProcessos = (lista) => copiarTabela(tabelaProcessos(lista))
