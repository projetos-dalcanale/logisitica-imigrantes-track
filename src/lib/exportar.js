import { formatarDataHora, stepsChecklistImport } from './processos'

// SEGURANÇA: o PDF é montado como HTML, então todo texto digitado é escapado.
const escapeHtml = (value) => {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// EXPORTAR PROCESSO EM PDF: versão "limpa" (preto no branco) só com os dados
// do processo, colocada na área #print-area; o navegador abre a impressão e a
// pessoa escolhe "Salvar como PDF". Não precisa de biblioteca nem internet.
export const exportarProcessoPDF = (proc) => {
  const isImport = proc.type === 'import'
  const titulo = isImport ? proc.importador || 'Processo de Importação' : proc.exportador || 'Processo de Exportação'
  const docLabel = isImport
    ? proc.documentoTipo ? `${proc.documentoTipo}: ${proc.documentoNumero || '—'}` : proc.documento || '—'
    : `Booking: ${proc.booking || '—'} | Ref: ${proc.referencia || '—'} | Navio: ${proc.navio || '—'}`

  let html = `
    <div style="border-bottom:2px solid #B10004; padding-bottom:12px; margin-bottom:16px;">
      <div style="font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#666;">LogiTrack Pro — Transportes Imigrantes</div>
      <div style="font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#B10004; font-weight:bold; margin-top:4px;">${isImport ? 'Importação' : 'Exportação'}</div>
      <h1 style="font-size:20px; margin:4px 0 0;">${escapeHtml(titulo)}</h1>
      <div style="font-size:12px; color:#444; margin-top:2px;">${escapeHtml(docLabel)}</div>
    </div>
    <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:18px;">
      <tr><td style="padding:4px 8px 4px 0; color:#666; width:140px;">Armador</td><td style="padding:4px 0; font-weight:bold;">${escapeHtml(proc.armador) || '—'}</td></tr>
      <tr><td style="padding:4px 8px 4px 0; color:#666;">Motorista</td><td style="padding:4px 0;">${escapeHtml(proc.motorista) || '—'}</td></tr>
      <tr><td style="padding:4px 8px 4px 0; color:#666;">Placas</td><td style="padding:4px 0;">${escapeHtml(proc.placas) || '—'}</td></tr>
      ${isImport ? `<tr><td style="padding:4px 8px 4px 0; color:#666;">Destino do Contêiner</td><td style="padding:4px 0;">${proc.finalizacaoVazio === 'baixa' ? 'Baixa de Contêiner (sem devolução)' : 'Devolução de Vazio'}</td></tr>` : ''}
      ${proc.observacoes ? `<tr><td style="padding:4px 8px 4px 0; color:#666; vertical-align:top;">Observações</td><td style="padding:4px 0;">${escapeHtml(proc.observacoes)}</td></tr>` : ''}
    </table>`

  ;(proc.containers || []).forEach((ct, index) => {
    html += `<div style="border:1px solid #ccc; border-radius:6px; padding:12px 14px; margin-bottom:12px; break-inside: avoid;">`
    html += `<div style="font-size:12px; font-weight:bold; margin-bottom:8px;">Contêiner ${index + 1} — ${escapeHtml(ct.numero) || 'Sem número'} ${ct.tipo ? '(' + escapeHtml(ct.tipo) + ')' : ''}</div>`
    if (!isImport) {
      html += `<div style="font-size:11px; color:#444; margin-bottom:8px;">Tara: ${escapeHtml(ct.tara) || '—'} &nbsp;|&nbsp; Lacre: ${escapeHtml(ct.lacre) || '—'}</div>`
    }
    html += `<table style="width:100%; border-collapse:collapse; font-size:11px;">`
    if (isImport) {
      stepsChecklistImport(proc).forEach((step) => {
        if (step.type === 'checkbox') {
          const feito = ct.checklist?.[step.id] === 'true'
          html += `<tr><td style="padding:3px 0; width:20px;">${feito ? '&#9989;' : '&#9744;'}</td><td style="padding:3px 0;">${escapeHtml(step.label)}</td></tr>`
        } else {
          const feito = ct.checklist?.[`${step.id}_check`] === 'true'
          html += `<tr><td style="padding:3px 0; width:20px;">${feito ? '&#9989;' : '&#9744;'}</td><td style="padding:3px 0;">${escapeHtml(step.label)}</td><td style="padding:3px 0; text-align:right; color:#444;">${formatarDataHora(ct.checklist?.[step.id])}</td></tr>`
        }
      })
    } else {
      ;[
        ['Deadline Draft', ct.deadlineDraft],
        ['Deadline Carga', ct.deadlineCarga],
        [`Retirada Vazio${ct.termVazioExp ? ' — ' + escapeHtml(ct.termVazioExp) : ''}`, ct.agVazio],
        [`Depósito Cheio${ct.termCheioExp ? ' — ' + escapeHtml(ct.termCheioExp) : ''}`, ct.agCheio],
      ].forEach(([label, valor]) => {
        html += `<tr><td style="padding:3px 0;">${label}</td><td style="padding:3px 0; text-align:right; color:#444;">${formatarDataHora(valor)}</td></tr>`
      })
    }
    html += `</table></div>`
  })

  html += `<div style="margin-top:20px; font-size:10px; color:#888; border-top:1px solid #ddd; padding-top:8px;">Gerado em ${formatarDataHora(new Date())} pelo LogiTrack Pro.</div>`

  document.getElementById('print-area').innerHTML = html
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
    const documento = isImport ? [proc.documentoTipo, proc.documentoNumero].filter(Boolean).join(' ') : proc.booking || ''
    const containersValidos = (proc.containers || []).filter((c) => c.numero)
    return [
      isImport ? 'Importação' : 'Exportação',
      proc.status === 'archived' ? 'Arquivado' : 'Ativo',
      proc.armador || '',
      proc.motorista || '',
      proc.placas || '',
      isImport ? proc.importador || '' : proc.exportador || '',
      documento,
      proc.referencia || '',
      proc.navio || '',
      isImport ? proc.termCarga || '' : '',
      isImport ? proc.termVazio || '' : '',
      isImport ? (proc.finalizacaoVazio === 'baixa' ? 'Baixa de Contêiner' : 'Devolução de Vazio') : '',
      containersValidos.map((c) => (c.tipo ? `${c.numero} (${c.tipo})` : c.numero)).join(' | '),
      containersValidos.length,
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
