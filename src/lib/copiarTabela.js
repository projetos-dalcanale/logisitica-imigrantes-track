// COPIAR A TABELA PARA O E-MAIL: põe na área de transferência uma tabela HTML
// (o Outlook e o Gmail colam como tabela) e o mesmo conteúdo em texto simples
// (colunas separadas por tab, que o Excel também entende).

const esc = (valor) =>
  String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\r?\n/g, '<br>')

// Estilos inline: o Outlook ignora <style> e classes.
const BORDA = '1px solid #c8c8cc'
const FONTE = "font-family:Calibri,'Segoe UI',Arial,sans-serif;font-size:11pt"
const TH = `style="${FONTE};font-weight:bold;text-align:left;background:#f2f2f4;border:${BORDA};padding:4px 8px;white-space:nowrap"`
const TD = `style="${FONTE};border:${BORDA};padding:4px 8px;vertical-align:top"`

export const htmlDaTabela = ({ cabecalho, linhas }) => {
  const cab = `<tr>${cabecalho.map((c) => `<th ${TH}>${esc(c)}</th>`).join('')}</tr>`
  const corpo = linhas.map((l) => `<tr>${l.map((v) => `<td ${TD}>${esc(v)}</td>`).join('')}</tr>`).join('')
  return `<table style="border-collapse:collapse;${FONTE}">${cab}${corpo}</table>`
}

const semQuebra = (valor) => String(valor ?? '').replace(/[\t\r\n]+/g, ' ')

export const textoDaTabela = ({ cabecalho, linhas }) =>
  [cabecalho, ...linhas].map((l) => l.map(semQuebra).join('\t')).join('\n')

// Plano B para navegadores sem ClipboardItem: seleciona uma tabela escondida e
// manda copiar.
const copiarPelaSelecao = (html) => {
  const caixa = document.createElement('div')
  caixa.contentEditable = 'true'
  caixa.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0'
  caixa.innerHTML = html
  document.body.appendChild(caixa)
  const selecao = window.getSelection()
  const faixa = document.createRange()
  faixa.selectNodeContents(caixa)
  selecao.removeAllRanges()
  selecao.addRange(faixa)
  const ok = document.execCommand('copy')
  selecao.removeAllRanges()
  caixa.remove()
  if (!ok) throw new Error('Não foi possível copiar.')
}

export const copiarTabela = async (tabela) => {
  const html = htmlDaTabela(tabela)
  const texto = textoDaTabela(tabela)
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([texto], { type: 'text/plain' }),
      }),
    ])
    return
  }
  copiarPelaSelecao(html)
}
