// FICHA DO PROCESSO EM PDF, com a identidade da empresa: faixa vermelha com
// o logo, dados em caixas e as etapas de cada contêiner em linha do tempo
// (com o horário em que cada uma foi marcada). Montada como HTML e impressa
// pelo navegador ("Salvar como PDF"). Todo texto digitado é escapado.
import { chaveEtapa, distintos, ehCargaSolta, etapaFeita, exportSteps, identificacaoUnidade, formatarDataHora, stepsChecklistImport, transportePorContainer } from './processos'

export const escapeHtml = (valor) =>
  valor === null || valor === undefined
    ? ''
    : String(valor).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const dataOuVazio = (valor) => (valor ? formatarDataHora(valor) : '')

// Etapas de um contêiner no mesmo formato para importação e exportação.
export const etapasDoContainer = (proc, ct) => {
  if (proc.type === 'import') {
    return stepsChecklistImport(proc).map((step) => {
      const chave = chaveEtapa(step)
      return {
        label: step.label,
        feito: etapaFeita(ct, step),
        concluidoEm: dataOuVazio(ct.checklist?.[`${chave}_em`]),
        agendado: step.type === 'datetime' ? dataOuVazio(ct.checklist?.[step.id]) : '',
      }
    })
  }
  return exportSteps.map((step) => ({
    label: step.label + (step.terminal && ct[step.terminal] ? ` · ${ct[step.terminal]}` : ''),
    feito: ct[step.check] === 'true',
    concluidoEm: dataOuVazio(ct[`${step.check}Em`]),
    agendado: dataOuVazio(ct[step.id]),
  }))
}

const CAMINHAO =
  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>'

const ESTILO = `
  .pf { font-family: -apple-system, BlinkMacSystemFont, "Inter Variable", "Segoe UI", Arial, sans-serif; color: #1d1d1f; font-size: 11.5px; }
  .pf * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .pf-topo { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-radius: 14px; color: #fff; background: linear-gradient(110deg, #e2232b, #a80008); }
  .pf-logo { width: 40px; height: 40px; border-radius: 11px; background: rgba(255,255,255,.18); display: flex; align-items: center; justify-content: center; flex: none; }
  .pf-marca b { display: block; font-size: 16px; }
  .pf-marca span { font-size: 11px; opacity: .85; }
  .pf-topo-dir { margin-left: auto; text-align: right; font-size: 11px; opacity: .9; }
  .pf-topo-dir b { display: block; font-size: 13px; opacity: 1; text-transform: uppercase; letter-spacing: .08em; }
  .pf-titulo { margin: 18px 2px 2px; font-size: 22px; font-weight: 700; letter-spacing: -.02em; }
  .pf-sub { margin: 0 2px 14px; color: #6e6e73; font-size: 12px; }
  .pf-grade { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
  .pf-caixa { background: #f5f5f7; border-radius: 10px; padding: 9px 11px; }
  .pf-rot { display: block; font-size: 8.5px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: #86868b; margin-bottom: 3px; }
  .pf-val { font-weight: 600; font-size: 12px; word-break: break-word; }
  .pf-ct { border: 1px solid #e5e5ea; border-radius: 12px; padding: 12px 14px; margin-bottom: 10px; break-inside: avoid; }
  .pf-ct-topo { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
  .pf-ct-topo b { font-size: 13px; }
  .pf-ct-topo span { color: #6e6e73; }
  .pf-ct-topo .pf-prog { margin-left: auto; font-size: 10.5px; color: #6e6e73; }
  .pf-ct .pf-grade { grid-template-columns: repeat(4, 1fr); margin-bottom: 8px; }
  .pf-ct .pf-caixa { padding: 7px 9px; }
  .pf-etapa { display: flex; align-items: center; gap: 10px; padding: 5px 0; position: relative; }
  .pf-etapa + .pf-etapa::before { content: ""; position: absolute; left: 8px; top: -6px; height: 10px; width: 2px; background: #e5e5ea; }
  .pf-etapa.feito + .pf-etapa::before { background: #ce111e; }
  .pf-bola { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid #c7c7cc; flex: none; display: flex; align-items: center; justify-content: center; background: #fff; }
  .pf-etapa.feito .pf-bola { background: #ce111e; border-color: #ce111e; }
  .pf-nome { flex: 1; }
  .pf-etapa.feito .pf-nome { color: #1d1d1f; font-weight: 600; }
  .pf-quando { color: #6e6e73; font-size: 10.5px; text-align: right; }
  .pf-quando .ok { color: #248a3d; font-weight: 600; }
  .pf-obs { background: #f5f5f7; border-radius: 10px; padding: 10px 12px; margin: 4px 0 12px; white-space: pre-wrap; }
  .pf-rodape { display: flex; justify-content: space-between; margin-top: 16px; padding-top: 8px; border-top: 1px solid #e5e5ea; font-size: 9.5px; color: #86868b; }
`

const caixa = (rotulo, valor) =>
  `<div class="pf-caixa"><span class="pf-rot">${escapeHtml(rotulo)}</span><span class="pf-val">${escapeHtml(valor) || '—'}</span></div>`

const CHECK = '<svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5l3 3 6-7"/></svg>'

export const montarHtmlProcesso = (proc, agora = new Date()) => {
  const isImport = proc.type === 'import'
  const solta = ehCargaSolta(proc)
  const transporte = transportePorContainer(proc)
  const cts = proc.containers || []
  const multi = cts.length > 1
  const titulo = (isImport ? proc.importador : proc.exportador) || 'Sem nome'
  const documento = isImport
    ? proc.documentoNumero
      ? [proc.documentoTipo || 'Documento', proc.documentoNumero]
      : ['Documento', proc.documento]
    : ['Booking', proc.booking]

  const dados = isImport
    ? [
        documento,
        ['Armador', proc.armador],
        ['Terminal de carregamento', proc.termCarga],
        solta
          ? ['Carga solta', identificacaoUnidade(proc)]
          : ['Destino do contêiner', proc.finalizacaoVazio === 'baixa' ? 'Baixa (sem devolução)' : `Devolução${proc.termVazio ? ` · ${proc.termVazio}` : ''}`],
      ]
    : [documento, ['Armador', proc.armador], ['Referência', proc.referencia], ['Navio', proc.navio]]
  if (!multi) {
    dados.push(['Motorista', distintos(transporte.map((t) => t.motorista)).join(', ')])
    dados.push(['Placas', distintos(transporte.map((t) => t.placas)).join(', ')])
  }

  const blocos = cts.map((ct, i) => {
    const etapas = etapasDoContainer(proc, ct)
    const feitas = etapas.filter((e) => e.feito).length
    const info = []
    if (multi) info.push(['Motorista', transporte[i].motorista], ['Placas', transporte[i].placas])
    if (isImport) {
      info.push(['Agend. carregamento', dataOuVazio(ct.checklist?.ag_carga)])
      if (proc.finalizacaoVazio !== 'baixa' && !solta) info.push(['Agend. vazio', dataOuVazio(ct.checklist?.ag_vazio)])
    } else {
      info.push(['Tara', ct.tara], ['Lacre', ct.lacre], ['Deadline Draft', dataOuVazio(ct.deadlineDraft)], ['Deadline Carga', dataOuVazio(ct.deadlineCarga)])
    }
    const linhas = etapas
      .map((e) => {
        const quando = e.feito
          ? `<span class="ok">Concluído${e.concluidoEm ? ` ${escapeHtml(e.concluidoEm)}` : ''}</span>`
          : e.agendado
            ? `Agendado ${escapeHtml(e.agendado)}`
            : ''
        return `<div class="pf-etapa${e.feito ? ' feito' : ''}"><span class="pf-bola">${e.feito ? CHECK : ''}</span><span class="pf-nome">${escapeHtml(e.label)}</span><span class="pf-quando">${quando}</span></div>`
      })
      .join('')
    const topo = solta
      ? `<b>Carga solta</b><span>${escapeHtml(identificacaoUnidade(proc))}</span>`
      : `<b>Contêiner ${i + 1}</b><span>${escapeHtml(ct.numero) || 'Sem número'}${ct.tipo ? ` · ${escapeHtml(ct.tipo)}` : ''}</span>`
    return `<div class="pf-ct">
      <div class="pf-ct-topo">${topo}<span class="pf-prog">${feitas} de ${etapas.length} etapas</span></div>
      <div class="pf-grade">${info.map(([r, v]) => caixa(r, v)).join('')}</div>
      ${linhas}
    </div>`
  })

  return `<style>${ESTILO}</style>
  <div class="pf">
    <div class="pf-topo">
      <div class="pf-logo">${CAMINHAO}</div>
      <div class="pf-marca"><b>Transportes Imigrantes</b><span>Ficha do processo</span></div>
      <div class="pf-topo-dir"><b>${isImport ? 'Importação' : 'Exportação'}</b>Gerado em ${formatarDataHora(agora)}</div>
    </div>
    <h1 class="pf-titulo">${escapeHtml(titulo)}</h1>
    <p class="pf-sub">${solta ? 'Carga solta' : `${cts.length} ${cts.length === 1 ? 'contêiner' : 'contêineres'}`}${proc.status === 'archived' ? ' · Arquivado' : ''}</p>
    <div class="pf-grade">${dados.map(([r, v]) => caixa(r, v)).join('')}</div>
    ${proc.observacoes?.trim() ? `<span class="pf-rot">Observações</span><div class="pf-obs">${escapeHtml(proc.observacoes.trim())}</div>` : ''}
    ${blocos.join('') || '<p class="pf-sub">Nenhum contêiner neste processo.</p>'}
    <div class="pf-rodape"><span>Transportes Imigrantes · LogiTrack Pro</span><span>${escapeHtml(titulo)}</span></div>
  </div>`
}
