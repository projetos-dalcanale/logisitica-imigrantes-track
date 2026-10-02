import { useEffect, useRef, useState } from 'react'
import { CircleMinus, CirclePlus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useDialog } from '../contexts/DialogContext'
import { useToast } from '../contexts/ToastContext'
import { atualizarPedagio, criarPedagio, excluirPedagio, novaRota } from '../lib/pedagios'
import Modal, { SheetHeader } from './ui/Modal'
import Button from './ui/Button'
import NumberInput from './ui/NumberInput'
import Segmented from './ui/Segmented'
import { Group, Row } from './ui/List'

const TRAJETO = [
  { value: 'ida', label: 'Somente ida' },
  { value: 'idaVolta', label: 'Ida e volta' },
]

function PedagioForm({ rota, onClose, onDelete }) {
  const { user } = useAuth()
  const showToast = useToast()
  const [form, setForm] = useState(() => ({ ...novaRota(), ...rota, pontos: [...(rota?.pontos || [])] }))
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState(false)
  const focarUltimo = useRef(false)

  // Ponto recém-adicionado: o cursor vai direto para ele.
  useEffect(() => {
    if (!focarUltimo.current) return
    focarUltimo.current = false
    document.getElementById(`ped-ponto-${form.pontos.length - 1}`)?.focus()
  }, [form.pontos.length])
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const salvar = async (e) => {
    e.preventDefault()
    const origem = form.origem.trim()
    const destino = form.destino.trim()
    if (!origem || !destino) {
      setErro(true)
      return
    }
    const pontos = form.pontos.map((p) => p.trim()).filter(Boolean)
    const data = { nome: form.nome.trim(), origem, pontos, destino, idaVolta: form.idaVolta, eixos: form.eixos, kmPrevisto: form.kmPrevisto, valorTotal: form.valorTotal }
    setSaving(true)
    try {
      if (rota?.id) await atualizarPedagio(rota.id, data, user.email)
      else await criarPedagio(data, user.email)
      showToast(`Rota ${data.nome || `${origem} → ${destino}`} salva.`)
      onClose()
    } catch (err) {
      console.error('Erro ao salvar rota de pedágio:', err)
      showToast(err.code === 'permission-denied' ? 'Sem permissão: atualize as regras do Firestore (coleção pedagios).' : 'Não foi possível salvar a rota.', 'error')
      setSaving(false)
    }
  }

  const vermelho = (v) => (erro && !v.trim() ? 'text-red-500' : '')
  return (
    <form onSubmit={salvar} className="flex min-h-0 flex-1 flex-col">
      <SheetHeader
        title={rota?.id ? 'Editar rota' : 'Nova rota'}
        left={<Button variant="plain" className="px-1" onClick={onClose}>Cancelar</Button>}
        right={<Button type="submit" variant="plain" className="px-1 font-semibold" loading={saving}>Salvar</Button>}
      />
      <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-4 pb-10 pt-2 sm:px-6">
        <Group title="Rota" footer={erro && (!form.origem.trim() || !form.destino.trim()) ? <span className="text-red-500">Informe a origem e o destino.</span> : undefined}>
          <Row label="Nome da rota" htmlFor="ped-nome">
            <input
              id="ped-nome"
              value={form.nome}
              maxLength={80}
              onChange={(e) => set({ nome: e.target.value })}
              placeholder="Ex: GJA X SP 05 eixos"
              className="field-plain text-right font-medium"
            />
          </Row>
          <Row label={<span className={vermelho(form.origem)}>Origem</span>} htmlFor="ped-origem">
            <input
              id="ped-origem"
              data-autofocus={!rota?.id || undefined}
              value={form.origem}
              maxLength={120}
              onChange={(e) => (set({ origem: e.target.value }), setErro(false))}
              placeholder="Ex: Santos, SP"
              className="field-plain text-right font-medium"
            />
          </Row>
          {form.pontos.map((ponto, i) => (
            <div key={i} className="flex min-h-11 items-center gap-3 px-4 py-1.5">
              <button type="button" aria-label={`Remover ponto ${i + 1}`} onClick={() => set({ pontos: form.pontos.filter((_, j) => j !== i) })} className="shrink-0 transition-transform active:scale-90">
                <CircleMinus className="size-5 fill-red-500 text-white dark:text-navy-800" strokeWidth={2} />
              </button>
              <label htmlFor={`ped-ponto-${i}`} className="shrink-0 text-[15px] text-ink">Ponto {i + 1}</label>
              <input
                id={`ped-ponto-${i}`}
                value={ponto}
                maxLength={120}
                onChange={(e) => set({ pontos: form.pontos.map((p, j) => (j === i ? e.target.value : p)) })}
                placeholder="Ex: Embu das Artes, SP"
                className="field-plain min-w-0 flex-1 text-right font-medium"
              />
            </div>
          ))}
          <Row label={<span className={vermelho(form.destino)}>Destino</span>} htmlFor="ped-destino">
            <input
              id="ped-destino"
              value={form.destino}
              maxLength={120}
              onChange={(e) => (set({ destino: e.target.value }), setErro(false))}
              placeholder="Ex: São Paulo, SP"
              className="field-plain text-right font-medium"
            />
          </Row>
          <button
            type="button"
            disabled={form.pontos.length >= 10}
            onClick={() => ((focarUltimo.current = true), set({ pontos: [...form.pontos, ''] }))}
            className="flex min-h-11 w-full items-center gap-3 px-4 text-left text-[15px] text-blue-500 transition-colors hover:bg-navy-700/40 disabled:opacity-50"
          >
            <CirclePlus className="size-5 fill-emerald-500 text-white dark:text-navy-800" strokeWidth={2} />
            Adicionar ponto
          </button>
          <Row label="Trajeto">
            <Segmented size="sm" className="w-52" options={TRAJETO} value={form.idaVolta ? 'idaVolta' : 'ida'} onChange={(v) => set({ idaVolta: v === 'idaVolta' })} />
          </Row>
          <Row label="Número de eixos" htmlFor="ped-eixos">
            <NumberInput plain id="ped-eixos" decimals={0} value={form.eixos} onChange={(eixos) => set({ eixos: Math.min(eixos, 99) })} className="w-32" />
          </Row>
        </Group>

        <Group title="Valores" footer="O valor total é o pedágio da rota inteira (considere ida e volta, se marcado).">
          <Row label="KM previsto" htmlFor="ped-km">
            <NumberInput plain id="ped-km" decimals={1} value={form.kmPrevisto} onChange={(kmPrevisto) => set({ kmPrevisto })} className="w-32" />
          </Row>
          <Row label="Valor total do pedágio (R$)" htmlFor="ped-valor">
            <NumberInput plain id="ped-valor" decimals={2} value={form.valorTotal} onChange={(valorTotal) => set({ valorTotal })} className="w-32" />
          </Row>
        </Group>

        {rota?.id && (
          <Group>
            <button type="button" onClick={onDelete} className="flex min-h-11 w-full items-center justify-center px-4 text-[15px] text-red-500 transition-colors hover:bg-red-500/5">
              Excluir rota
            </button>
          </Group>
        )}
      </div>
    </form>
  )
}

// FICHA DE UMA ROTA DE PEDÁGIO: cadastro e edição. `rota` null = nova.
export default function PedagioModal({ rota, onClose }) {
  const { confirm } = useDialog()
  const showToast = useToast()

  const excluir = async () => {
    const ok = await confirm({
      title: `Excluir rota ${rota.nome || `${rota.origem} → ${rota.destino}`}?`,
      message: 'A rota e seus valores serão apagados para toda a equipe. Essa ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      danger: true,
    })
    if (!ok) return
    await excluirPedagio(rota.id)
    onClose()
    showToast('Rota de pedágio excluída.')
  }

  return (
    <Modal onClose={onClose} title={rota ? 'Editar rota' : 'Nova rota'} size="md" sheet grouped>
      <PedagioForm rota={rota} onClose={onClose} onDelete={excluir} />
    </Modal>
  )
}
