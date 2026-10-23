// PRÉVIA DO PROCESSO (ao passar o mouse na tabela): o essencial de um processo
// sem abrir a ficha. Só dados; quem desenha é components/ProcessoPrevia.jsx.
import { etapasDoContainer, etapasProcesso, ordenarContainers, proximaAcao } from './etapas'
import { formatarPlacas, identificacaoUnidade, transportePorContainer } from './processos'

const MAX_CONTAINERS = 6
const MAX_OBSERVACOES = 160

export const previaDoProcesso = (proc, now = Date.now()) => {
  const isImport = proc.type === 'import'
  const gravados = proc.containers || []
  const cts = ordenarContainers(proc)
  // O transporte é por contêiner na ordem gravada: busca pelo contêiner, não pela posição.
  const transporte = transportePorContainer(proc)
  const transporteDe = (ct) => transporte[gravados.indexOf(ct)]
  const observacoes = (proc.observacoes || '').replace(/\s+/g, ' ').trim()
  return {
    titulo: ((isImport ? proc.importador : proc.exportador) || '').trim() || 'Sem nome',
    tipo: proc.type,
    acao: proximaAcao(proc, now),
    etapas: etapasProcesso(proc).map(({ label, feitos, total }) => ({ label, feitos, total })),
    containers: cts.slice(0, MAX_CONTAINERS).map((ct, i) => {
      const { feitas, total } = etapasDoContainer(proc, ct)
      return {
        rotulo: identificacaoUnidade(proc, ct) || `Contêiner ${i + 1}`,
        motorista: transporteDe(ct)?.motorista || '',
        placas: formatarPlacas(transporteDe(ct)?.placas),
        etapas: `${feitas}/${total}`,
      }
    }),
    restantes: Math.max(0, cts.length - MAX_CONTAINERS),
    observacoes: observacoes.length > MAX_OBSERVACOES ? `${observacoes.slice(0, MAX_OBSERVACOES)}…` : observacoes,
  }
}
