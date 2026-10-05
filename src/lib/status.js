// STATUS PARA CLIENTES: monta o e-mail de atualização de um processo
// (assunto + corpo em texto e em HTML) para copiar e colar no e-mail.

const escapeHtml = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

// "Bom dia", "Boa tarde" ou "Boa noite" conforme a hora.
export const saudacao = (data = new Date()) => {
  const h = data.getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

// Frases prontas para montar a mensagem com um clique.
export const FRASES = [
  'Carregamento liberado.',
  'Veículo em rota com previsão de entrega às __h.',
  'Carga entregue.',
  'Aguardando liberação do terminal.',
  'Contêiner devolvido.',
]

// Só o que o cliente precisa: nome, documento e contêineres.
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
  const containers = (proc.containers || []).map((c) => (c.numero || '').trim()).filter(Boolean)
  return { cliente, documento, containers }
}

const linhasInfo = ({ cliente, documento, containers }) =>
  [
    cliente && ['Cliente', cliente],
    documento && [documento.rotulo, documento.numero],
    containers.length > 0 && [containers.length > 1 ? 'Contêineres' : 'Contêiner', containers.join(', ')],
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
