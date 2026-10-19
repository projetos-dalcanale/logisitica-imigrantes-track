// SEÇÕES DA FICHA DO PROCESSO: lista (para o índice) do que a ficha mostra
// para um processo e o resumo que aparece quando uma seção está recolhida.
import { ehCargaSolta } from './processos'
import { etapasDoContainer } from './etapas'

export const secoesDaFicha = (proc) => {
  const cts = proc.containers || []
  const secoes = [{ id: 'detalhes', kind: 'detalhes', label: 'Detalhes' }]
  // Com mais de um contêiner, transporte e agendamentos ficam em cada um.
  if (cts.length <= 1) secoes.push({ id: 'transporte', kind: 'transporte', label: 'Transporte' })
  if (proc.type === 'import' && cts.length === 1) secoes.push({ id: 'agendamentos', kind: 'agendamentos', label: 'Agendamentos' })
  secoes.push({ id: 'observacoes', kind: 'observacoes', label: 'Observações' })
  const solta = ehCargaSolta(proc)
  cts.forEach((ct, i) => secoes.push({ id: `conteiner-${ct.id}`, kind: 'conteiner', label: solta ? 'Carga solta' : `Contêiner ${i + 1}` }))
  return secoes
}

// "MSCU 123.456-6 · 2 de 6 etapas" (sem número: "Contêiner 2 · …").
export const resumoContainer = (proc, ct, index) => {
  const { feitas, total } = etapasDoContainer(proc, ct)
  const nome = (ct.numero || '').trim() || `Contêiner ${index + 1}`
  return `${nome} · ${feitas} de ${total} etapas`
}
