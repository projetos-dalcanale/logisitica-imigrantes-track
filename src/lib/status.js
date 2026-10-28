// STATUS PARA CLIENTES: monta o e-mail de atualização de um processo
// (assunto + corpo em texto e em HTML) para copiar e colar no e-mail.

const escapeHtml = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

// "Bom dia", "Boa tarde" ou "Boa noite" conforme a hora.
export const saudacao = (data = new Date()) => {
  const h = data.getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

import { ehCargaSolta, identificacaoUnidade } from './processos'

// Nome do contêiner com o tipo ao lado: "MSCU 123.456-6 (40'HC)". Sem tipo,
// só o número; sem número, texto vazio.
export const rotuloContainer = (ct) => {
  const numero = (ct?.numero || '').trim()
  const tipo = (ct?.tipo || '').trim()
  return numero && tipo ? `${numero} (${tipo})` : numero
}

// Só os contêineres escolhidos (na ordem gravada), para falar de alguns de um
// processo com vários. Sem escolha, com ids que não existem ou em carga solta,
// devolve o próprio processo (o status nunca fica sem contêiner).
export const comContainers = (proc, ids) => {
  if (!ids?.length || ehCargaSolta(proc)) return proc
  const escolhidos = (proc.containers || []).filter((ct) => ids.includes(ct.id))
  return escolhidos.length ? { ...proc, containers: escolhidos } : proc
}

// Só o que o cliente precisa: nome, documento e contêineres (ou a carga
// solta). `containers` são os números puros (assunto do e-mail); `unidades`, os
// nomes com o tipo ao lado (imagem e texto). `rotuloUnidade` é o nome da linha:
// Contêiner, Contêineres ou Carga.
export const dadosDoProcesso = (proc) => {
  const isImport = proc.type === 'import'
  const cliente = (isImport ? proc.importador : proc.exportador) || ''
  let documento = null
  if (isImport) {
    if (proc.documentoNumero) documento = { rotulo: proc.documentoTipo || 'Documento', numero: proc.documentoNumero }
    else if (proc.documento) documento = { rotulo: 'Documento', numero: proc.documento }
  } else if (proc.booking) {
    documento = { rotulo: 'Booking', numero: proc.booking }
  }
  if (ehCargaSolta(proc)) {
    const carga = [identificacaoUnidade(proc)]
    return { cliente, documento, containers: carga, unidades: carga, rotuloUnidade: 'Carga' }
  }
  const containers = (proc.containers || []).map((c) => (c.numero || '').trim()).filter(Boolean)
  const unidades = (proc.containers || []).map(rotuloContainer).filter(Boolean)
  return { cliente, documento, containers, unidades, rotuloUnidade: containers.length > 1 ? 'Contêineres' : 'Contêiner' }
}

const linhasInfo = ({ cliente, documento, unidades, rotuloUnidade }) =>
  [
    cliente && ['Cliente', cliente],
    documento && [documento.rotulo, documento.numero],
    unidades.length > 0 && [rotuloUnidade, unidades.join(', ')],
  ].filter(Boolean)

export const montarStatus = (proc, mensagem) => {
  const dados = dadosDoProcesso(proc)
  const info = linhasInfo(dados)
  const msg = (mensagem || '').trim()

  const assunto = ['Status', dados.cliente, dados.documento && `${dados.documento.rotulo} ${dados.documento.numero}`, dados.containers.join(', ')]
    .filter(Boolean)
    .join(' – ')

  const texto = [msg, info.map(([r, v]) => `${r}: ${v}`).join('\n')].filter(Boolean).join('\n\n')

  // HTML simples, no estilo de um e-mail comum (cola formatado no Outlook/Gmail).
  const fonte = 'font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#1d1d1f;'
  const paragrafos = msg
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 10px;${fonte}">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('')
  const bloco = info.length
    ? `<p style="margin:14px 0 0;${fonte}">${info.map(([r, v]) => `<b>${escapeHtml(r)}:</b> ${escapeHtml(v)}`).join('<br>')}</p>`
    : ''
  const html = `<div style="${fonte}">${paragrafos}${bloco}</div>`

  return { assunto, texto, html }
}
