import { useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useDialog } from '../contexts/DialogContext'
import { useToast } from '../contexts/ToastContext'
import { opcoesDeProcesso, validarPendencia } from '../lib/pendencias'
import { atualizarPendencia, excluirPendencia } from '../lib/pendenciasDb'
import Modal, { SheetHeader } from './ui/Modal'
import Button from './ui/Button'
import Combobox from './ui/Combobox'
import { Group, Row } from './ui/List'

function PendenciaForm({ pendencia, processes, onClose, onDelete }) {
  const { user } = useAuth()
  const showToast = useToast()
  const [titulo, setTitulo] = useState(pendencia.titulo || '')
  const [data, setData] = useState(pendencia.data || '')
  const [rotulo, setRotulo] = useState(pendencia.processoRotulo || '')
  const [saving, setSaving] = useState(false)
  const opcoes = useMemo(() => opcoesDeProcesso(processes), [processes])
  // O vínculo gravado continua escolhível mesmo que o processo não esteja mais na lista (arquivado, excluído).
  const rotulos = opcoes.map((o) => o.rotulo)
  if (pendencia.processoRotulo && !rotulos.includes(pendencia.processoRotulo)) rotulos.push(pendencia.processoRotulo)
  const erro = validarPendencia({ titulo, data })

  const salvar = async (e) => {
    e.preventDefault()
    if (erro) {
      showToast(erro, 'error')
      return
    }
    const escolhido = opcoes.find((o) => o.rotulo === rotulo)
    // Sem escolha: sem vínculo. Rótulo que não está na lista: mantém o vínculo que já estava gravado.
    const vinculo = !rotulo
      ? { processoId: null, processoRotulo: null }
      : escolhido
        ? { processoId: escolhido.id, processoRotulo: escolhido.rotulo }
        : { processoId: pendencia.processoId || null, processoRotulo: pendencia.processoRotulo || null }
    setSaving(true)
    try {
      await atualizarPendencia(pendencia.id, { titulo, data, ...vinculo }, user.email)
      onClose()
    } catch (err) {
      console.error('Erro ao salvar pendência:', err)
      showToast(err.code === 'permission-denied' ? 'Sem permissão: atualize as regras do Firestore (coleção pendencias).' : 'Não foi possível salvar a pendência.', 'error')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={salvar} className="flex min-h-0 flex-1 flex-col">
      <SheetHeader
        title="Editar pendência"
        left={<Button variant="plain" className="px-1" onClick={onClose}>Cancelar</Button>}
        right={<Button type="submit" variant="plain" className="px-1 font-semibold" loading={saving}>Salvar</Button>}
      />
      <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-4 pb-10 pt-2 sm:px-6">
        <Group>
          <Row label="Título" htmlFor="pend-titulo">
            <input id="pend-titulo" data-autofocus value={titulo} maxLength={200} onChange={(e) => setTitulo(e.target.value)} placeholder="O que precisa ser feito" className="field-plain text-right font-medium" />
          </Row>
          <Row label="Dia" htmlFor="pend-dia">
            <input id="pend-dia" type="date" value={data} onChange={(e) => setData(e.target.value)} className="field-plain text-right font-medium" />
          </Row>
          <Row label="Processo">
            <Combobox variant="plain" value={rotulo} options={rotulos} onChange={setRotulo} placeholder="Nenhum" searchPlaceholder="Buscar processo..." />
          </Row>
        </Group>
        <Group>
          <button type="button" onClick={onDelete} className="flex min-h-11 w-full items-center justify-center px-4 text-[15px] text-red-500 transition-colors hover:bg-red-500/5">
            Excluir pendência
          </button>
        </Group>
      </div>
    </form>
  )
}

// EDIÇÃO DE UMA PENDÊNCIA: título, dia e processo vinculado (opcional). A criação é pelo campo rápido da aba.
export default function PendenciaModal({ pendencia, processes, onClose }) {
  const { confirm } = useDialog()
  const showToast = useToast()

  const excluir = async () => {
    const ok = await confirm({
      title: 'Excluir esta pendência?',
      message: `“${pendencia.titulo}” será apagada para toda a equipe. Essa ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      danger: true,
    })
    if (!ok) return
    try {
      await excluirPendencia(pendencia.id)
      onClose()
      showToast('Pendência excluída.')
    } catch (err) {
      console.error('Erro ao excluir pendência:', err)
      showToast('Não foi possível excluir a pendência.', 'error')
    }
  }

  return (
    <Modal onClose={onClose} title="Editar pendência" size="md" sheet grouped>
      <PendenciaForm pendencia={pendencia} processes={processes} onClose={onClose} onDelete={excluir} />
    </Modal>
  )
}
