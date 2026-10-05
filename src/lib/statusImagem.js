// IMAGEM DE STATUS: cartão nas cores da empresa, desenhado num <canvas>,
// para copiar e colar no e-mail do cliente (ou baixar como PNG).
import { dadosDoProcesso } from './status'

// Etapas da barra de progresso por tipo de processo.
export const etapasDaImagem = (proc) => {
  if (proc.type === 'export') return ['Vazio retirado', 'Estufado', 'Em rota', 'Entregue no terminal']
  const etapas = ['Liberado', 'Em rota', 'Entregue', 'Vazio devolvido']
  return proc.finalizacaoVazio === 'baixa' ? etapas.slice(0, 3) : etapas
}

// Situações que o responsável escolhe. `etapa` = até onde chegou na barra
// (-1 = nenhuma ainda; null = sem barra).
export const opcoesDeStatus = (proc) => {
  if (proc.type === 'export') {
    return [
      { id: 'vazio', titulo: 'Vazio retirado', etapa: 0 },
      { id: 'estufado', titulo: 'Estufagem concluída', etapa: 1 },
      // Numeração, tara e lacre para o cliente conferir. Sem barra de progresso:
      // pode ir bem antes do embarque (retirada antecipada para cumprir o Draft).
      // (as fotos vão anexadas no e-mail).
      { id: 'dados', titulo: 'Dados do contêiner', etapa: null, tabela: true, detalhes: 'Segue abaixo dados do container e fotos em anexo para conferência.' },
      { id: 'rota', titulo: 'Veículo em rota', etapa: 2 },
      { id: 'terminal', titulo: 'Cheio entregue no terminal', etapa: 3 },
      { id: 'outro', titulo: 'Atualização do processo', etapa: null },
    ]
  }
  const opcoes = [
    { id: 'aguardando', titulo: 'Aguardando liberação', etapa: -1 },
    { id: 'liberado', titulo: 'Carregamento liberado', etapa: 0 },
    { id: 'rota', titulo: 'Veículo em rota', etapa: 1 },
    { id: 'entregue', titulo: 'Carga entregue', etapa: 2 },
    { id: 'devolvido', titulo: 'Contêiner devolvido', etapa: 3 },
    { id: 'outro', titulo: 'Atualização do processo', etapa: null },
  ]
  return proc.finalizacaoVazio === 'baixa' ? opcoes.filter((o) => o.id !== 'devolvido') : opcoes
}

// Numeração, tara e lacre de cada contêiner (tara só com números ganha "kg").
export const dadosDosContainers = (proc) =>
  (proc.containers || []).map((ct) => {
    const tara = String(ct.tara || '').trim()
    return {
      numero: String(ct.numero || '').trim() || '—',
      tara: /^\d+$/.test(tara) ? `${Number(tara).toLocaleString('pt-BR')} kg` : tara || '—',
      lacre: String(ct.lacre || '').trim() || '—',
    }
  })

// Quebra um texto em linhas que caibam na largura (medida injetável para teste).
export const quebrarLinhas = (texto, largura, medir) => {
  const linhas = []
  for (const paragrafo of String(texto || '').split('\n')) {
    let atual = ''
    for (const palavra of paragrafo.split(/\s+/).filter(Boolean)) {
      const tentativa = atual ? `${atual} ${palavra}` : palavra
      if (atual && medir(tentativa) > largura) {
        linhas.push(atual)
        atual = palavra
      } else {
        atual = tentativa
      }
    }
    linhas.push(atual)
  }
  while (linhas.length && !linhas[linhas.length - 1]) linhas.pop()
  return linhas
}

// PNG com DPI (chunk pHYs): com 2x de resolução, marcar 192 DPI faz o
// Outlook/Word mostrarem a imagem no tamanho certo, sem ficar gigante.
const TABELA_CRC = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

export const crc32 = (bytes) => {
  let c = 0xffffffff
  for (const b of bytes) c = TABELA_CRC[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

export const pngComDpi = (png, dpi) => {
  const ppm = Math.round(dpi / 0.0254)
  const dados = new Uint8Array(13)
  const dv = new DataView(dados.buffer)
  dados.set([0x70, 0x48, 0x59, 0x73]) // "pHYs"
  dv.setUint32(4, ppm)
  dv.setUint32(8, ppm)
  dados[12] = 1 // unidade: metro
  const chunk = new Uint8Array(4 + 13 + 4)
  const cv = new DataView(chunk.buffer)
  cv.setUint32(0, 9)
  chunk.set(dados, 4)
  cv.setUint32(17, crc32(dados))
  const fimIHDR = 8 + 4 + 4 + 13 + 4 // assinatura + IHDR completo
  const out = new Uint8Array(png.length + chunk.length)
  out.set(png.subarray(0, fimIHDR), 0)
  out.set(chunk, fimIHDR)
  out.set(png.subarray(fimIHDR), fimIHDR + chunk.length)
  return out
}

// ---- Desenho ----

export const LARGURA = 720
export const ESCALA = 2
const FONTE = '"Inter Variable", "Segoe UI", Arial, sans-serif'
const COR = {
  vermelho: '#ce111e',
  vermelhoClaro: '#e2232b',
  vermelhoEscuro: '#a80008',
  tinta: '#1d1d1f',
  cinza: '#6e6e73',
  cinzaClaro: '#86868b',
  linha: '#e5e5ea',
  fundoInfo: '#f5f5f7',
}
// Caminhos do ícone de caminhão (Lucide), o mesmo do logo do app.
const CAMINHAO = [
  'M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2',
  'M15 18H9',
  'M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14',
]

const pad = (n) => String(n).padStart(2, '0')
const fonte = (peso, tamanho) => `${peso} ${tamanho}px ${FONTE}`

const retanguloArredondado = (ctx, x, y, w, h, r) => {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

// Calcula a altura e desenha o cartão. `canvas` é redimensionado.
export const desenharStatus = (canvas, { proc, titulo, detalhes, etapa, tabela = false, data = new Date() }) => {
  const ctx = canvas.getContext('2d')
  const { cliente, documento, containers } = dadosDoProcesso(proc)
  const M = 36 // margem interna
  const W = LARGURA
  const etapas = etapa === null ? null : etapasDaImagem(proc)

  // Medidas de texto para saber a altura antes de desenhar.
  const medir = (f) => (t) => {
    ctx.font = f
    return ctx.measureText(t).width
  }
  const linhasTitulo = quebrarLinhas(titulo || 'Atualização do processo', W - 2 * M, medir(fonte(700, 28)))
  const linhasDetalhes = quebrarLinhas(detalhes, W - 2 * M, medir(fonte(400, 16)))
  const info = [
    ['Cliente', cliente || '—'],
    [documento?.rotulo || 'Documento', documento?.numero || '—'],
    // Um contêiner por linha, para o número não quebrar no meio. Com a
    // tabela de dados, os contêineres aparecem nela.
    !tabela && [containers.length > 1 ? 'Contêineres' : 'Contêiner', containers.join('\n') || '—'],
  ].filter(Boolean)
  const linhasTabela = tabela ? dadosDosContainers(proc) : []
  const alturaTabela = tabela ? 38 + Math.max(linhasTabela.length, 1) * 40 + 6 : 0
  const colunas = info.length
  const larguraColuna = (W - 2 * M - (colunas - 1) * 12) / colunas
  const linhasInfo = info.map(([, v]) => quebrarLinhas(v, larguraColuna - 28, medir(fonte(600, 15))))
  const alturaInfo = 22 + 20 + Math.max(...linhasInfo.map((l) => l.length)) * 21 + 16

  const H_TOPO = 92
  let altura = H_TOPO + 34 + 18 + linhasTitulo.length * 36
  if (etapas) altura += 30 + 62
  if (linhasDetalhes.length) altura += 22 + linhasDetalhes.length * 25
  altura += 28 + alturaInfo + 28 + 1 + 44
  if (tabela) altura += 12 + alturaTabela

  canvas.width = W * ESCALA
  canvas.height = Math.ceil(altura) * ESCALA
  ctx.setTransform(ESCALA, 0, 0, ESCALA, 0, 0)
  ctx.textBaseline = 'alphabetic'

  // Cartão branco com cantos arredondados (fundo transparente em volta).
  ctx.save()
  retanguloArredondado(ctx, 0, 0, W, altura, 20)
  ctx.clip()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, altura)

  // Faixa superior na cor da marca.
  const grad = ctx.createLinearGradient(0, 0, W, H_TOPO)
  grad.addColorStop(0, COR.vermelhoClaro)
  grad.addColorStop(1, COR.vermelhoEscuro)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H_TOPO)

  // Logo: quadrado branco translúcido com o caminhão.
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  retanguloArredondado(ctx, M, 22, 48, 48, 13)
  ctx.fill()
  ctx.save()
  ctx.translate(M + 10, 32)
  ctx.scale(28 / 24, 28 / 24)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2.1
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const d of CAMINHAO) ctx.stroke(new Path2D(d))
  for (const cx of [17, 7]) {
    ctx.beginPath()
    ctx.arc(cx, 18, 2, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()

  ctx.fillStyle = '#ffffff'
  ctx.font = fonte(700, 20)
  ctx.fillText('Transportes Imigrantes', M + 64, 44)
  ctx.font = fonte(500, 13)
  ctx.fillStyle = 'rgba(255,255,255,0.82)'
  ctx.fillText('Atualização de status', M + 64, 64)

  ctx.textAlign = 'right'
  ctx.font = fonte(700, 18)
  ctx.fillStyle = '#ffffff'
  ctx.fillText(`${pad(data.getHours())}:${pad(data.getMinutes())}`, W - M, 44)
  ctx.font = fonte(500, 13)
  ctx.fillStyle = 'rgba(255,255,255,0.82)'
  ctx.fillText(`${pad(data.getDate())}/${pad(data.getMonth() + 1)}/${data.getFullYear()}`, W - M, 64)
  ctx.textAlign = 'left'

  // Título do status.
  let y = H_TOPO + 34
  ctx.font = fonte(700, 11)
  ctx.fillStyle = COR.vermelho
  ctx.letterSpacing = '1.5px'
  ctx.fillText('STATUS', M, y)
  ctx.letterSpacing = '0px'
  y += 18
  ctx.font = fonte(700, 28)
  ctx.fillStyle = COR.tinta
  for (const linha of linhasTitulo) {
    y += 30
    ctx.fillText(linha, M, y)
    y += 6
  }

  // Barra de progresso.
  if (etapas) {
    y += 30
    const x0 = M + 14
    const x1 = W - M - 14
    const passo = (x1 - x0) / (etapas.length - 1)
    const cy = y + 12
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.strokeStyle = COR.linha
    ctx.beginPath()
    ctx.moveTo(x0, cy)
    ctx.lineTo(x1, cy)
    ctx.stroke()
    if (etapa > 0) {
      ctx.strokeStyle = COR.vermelho
      ctx.beginPath()
      ctx.moveTo(x0, cy)
      ctx.lineTo(x0 + passo * Math.min(etapa, etapas.length - 1), cy)
      ctx.stroke()
    }
    etapas.forEach((nome, i) => {
      const cx = x0 + passo * i
      const feita = i <= etapa
      const proxima = i === etapa + 1
      ctx.beginPath()
      ctx.arc(cx, cy, feita ? 12 : 10, 0, Math.PI * 2)
      ctx.fillStyle = feita ? COR.vermelho : '#ffffff'
      ctx.fill()
      if (!feita) {
        ctx.lineWidth = proxima ? 3 : 2
        ctx.strokeStyle = proxima ? COR.vermelho : '#c7c7cc'
        ctx.stroke()
      }
      if (feita) {
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2.6
        ctx.beginPath()
        ctx.moveTo(cx - 5, cy)
        ctx.lineTo(cx - 1.5, cy + 3.5)
        ctx.lineTo(cx + 5, cy - 3.5)
        ctx.stroke()
      }
      ctx.font = fonte(i === etapa ? 700 : 500, 12.5)
      ctx.fillStyle = feita || proxima ? COR.tinta : COR.cinzaClaro
      ctx.textAlign = i === 0 ? 'left' : i === etapas.length - 1 ? 'right' : 'center'
      const tx = i === 0 ? cx - 12 : i === etapas.length - 1 ? cx + 12 : cx
      ctx.fillText(nome, tx, cy + 36)
      ctx.textAlign = 'left'
    })
    y += 62
  }

  // Detalhes escritos pelo responsável.
  if (linhasDetalhes.length) {
    y += 22
    ctx.font = fonte(400, 16)
    ctx.fillStyle = '#3a3a3c'
    for (const linha of linhasDetalhes) {
      y += 19
      ctx.fillText(linha, M, y)
      y += 6
    }
  }

  // Dados do processo em caixinhas.
  y += 28
  info.forEach(([rotulo], i) => {
    const x = M + i * (larguraColuna + 12)
    ctx.fillStyle = COR.fundoInfo
    retanguloArredondado(ctx, x, y, larguraColuna, alturaInfo, 12)
    ctx.fill()
    ctx.font = fonte(600, 11)
    ctx.fillStyle = COR.cinzaClaro
    ctx.letterSpacing = '1px'
    ctx.fillText(rotulo.toUpperCase(), x + 14, y + 24)
    ctx.letterSpacing = '0px'
    ctx.font = fonte(600, 15)
    ctx.fillStyle = COR.tinta
    linhasInfo[i].forEach((linha, j) => ctx.fillText(linha, x + 14, y + 46 + j * 21))
  })
  y += alturaInfo

  // Tabela com numeração, tara e lacre de cada contêiner.
  if (tabela) {
    y += 12
    const largura = W - 2 * M
    const util = largura - 32
    ctx.fillStyle = COR.fundoInfo
    retanguloArredondado(ctx, M, y, largura, alturaTabela, 12)
    ctx.fill()
    // [rótulo, campo, início da coluna (fração), fim da coluna (fração)]
    const cols = [
      ['Contêiner', 'numero', 0, 0.45],
      ['Tara', 'tara', 0.45, 0.7],
      ['Lacre', 'lacre', 0.7, 1],
    ]
    ctx.font = fonte(600, 11)
    ctx.fillStyle = COR.cinzaClaro
    ctx.letterSpacing = '1px'
    cols.forEach(([rotulo, , ini]) => ctx.fillText(rotulo.toUpperCase(), M + 16 + ini * util, y + 25))
    ctx.letterSpacing = '0px'
    ctx.font = fonte(600, 15)
    linhasTabela.forEach((linha, i) => {
      const ly = y + 38 + i * 40
      ctx.fillStyle = COR.linha
      ctx.fillRect(M + 16, ly, util, 1)
      ctx.fillStyle = COR.tinta
      cols.forEach(([, campo, ini, fim]) => {
        // Corta com "…" se não couber na coluna.
        const max = (fim - ini) * util - 12
        let texto = linha[campo]
        while (texto.length > 1 && ctx.measureText(texto).width > max) texto = `${texto.slice(0, -2)}…`
        ctx.fillText(texto, M + 16 + ini * util, ly + 26)
      })
    })
    y += alturaTabela
  }
  y += 28

  // Rodapé.
  ctx.fillStyle = COR.linha
  ctx.fillRect(M, y, W - 2 * M, 1)
  ctx.font = fonte(500, 12)
  ctx.fillStyle = COR.cinzaClaro
  ctx.fillText('Transportes Imigrantes', M, y + 28)
  ctx.textAlign = 'right'
  ctx.fillText('Em caso de dúvidas, responda este e-mail.', W - M, y + 28)
  ctx.textAlign = 'left'

  ctx.restore()
  // Borda fina do cartão.
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'
  ctx.lineWidth = 1
  retanguloArredondado(ctx, 0.5, 0.5, W - 1, altura - 1, 20)
  ctx.stroke()
}

// PNG final (com DPI ajustado) como Blob.
export const imagemDoCanvas = (canvas) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) return reject(new Error('Falha ao gerar a imagem'))
      const bytes = new Uint8Array(await blob.arrayBuffer())
      resolve(new Blob([pngComDpi(bytes, 96 * ESCALA)], { type: 'image/png' }))
    }, 'image/png')
  })

// Largura com que a imagem aparece no e-mail (o corpo de um e-mail comum
// tem uns 600 px). Muitos programas ignoram o DPI do PNG e colam a imagem
// no tamanho real em pixels, então o tamanho vai travado no HTML copiado.
export const LARGURA_EMAIL = 560

// Versão reduzida (pixels reais = largura de exibição), para os programas
// que colam só a imagem.
export const imagemReduzida = (canvas, largura = LARGURA_EMAIL) =>
  new Promise((resolve, reject) => {
    const menor = document.createElement('canvas')
    menor.width = largura
    menor.height = Math.round((canvas.height * largura) / canvas.width)
    const ctx = menor.getContext('2d')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(canvas, 0, 0, menor.width, menor.height)
    menor.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar a imagem'))), 'image/png')
  })

// HTML com a imagem em alta resolução, mas exibida na largura do e-mail.
export const htmlDaImagem = (canvas, alt, largura = LARGURA_EMAIL) => {
  const altura = Math.round((canvas.height * largura) / canvas.width)
  const texto = String(alt || '').replace(/[<>"&]/g, '')
  return `<img src="${canvas.toDataURL('image/png')}" width="${largura}" height="${altura}" alt="${texto}" style="width:${largura}px;height:${altura}px;max-width:100%;border:0;display:block">`
}
