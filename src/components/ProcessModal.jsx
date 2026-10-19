import Modal, { SheetHeader } from './ui/Modal'
import Button from './ui/Button'
import SaveIndicator from './SaveIndicator'
import ProcessFicha from './ficha/ProcessFicha'

// FICHA DO PROCESSO em janela (no celular, folha deslizante). O conteúdo
// está em ficha/ProcessFicha, que também alimenta o painel lateral.
export default function ProcessModal({ proc, processes, onClose, onEnviarStatus }) {
  const isImport = proc.type === 'import'
  const title = isImport ? proc.importador || 'Processo de importação' : proc.exportador || 'Processo de exportação'
  return (
    <Modal onClose={onClose} title={title} size="xl" sheet grouped>
      <SheetHeader
        title=""
        left={<div className="pl-1"><SaveIndicator /></div>}
        right={<Button variant="plain" className="px-1 font-semibold" onClick={onClose}>OK</Button>}
      />
      <ProcessFicha proc={proc} processes={processes} onClose={onClose} onEnviarStatus={onEnviarStatus} />
    </Modal>
  )
}
