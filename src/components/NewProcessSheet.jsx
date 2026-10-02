import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowDownToLine, ArrowUpFromLine, CircleMinus, CirclePlus } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { useDialog } from '../contexts/DialogContext'
import { criarProcesso, novoContainer, numeroContainerDuplicado } from '../lib/processActions'
import { DESTINOS, DOC_TIPOS, mascaraNumeroContainer, validarNumeroContainer } from '../lib/processos'
import RegistrySelect from './RegistrySelect'
import Modal, { SheetHeader } from './ui/Modal'
import Button from './ui/Button'
import Segmented from './ui/Segmented'
import { Group, Row } from './ui/List'

const EMPTY = {
  armador: '', motorista: '', placas: '', observacoes: '',
  importador: '', documentoTipo: '', documentoNumero: '', termCarga: '', termVazio: '', finalizacaoVazio: 'devolucao',
  exportador: '', referencia: '', booking: '', navio: '',
}

let unidadeSeq = 0
const novaUnidade = () => ({ key: ++unidadeSeq, numero: '', tipo: '' })

// NOVO PROCESSO: folha no estilo iOS (Cancelar · título · Criar) com o
// formulário em listas agrupadas. Contêineres são opcionais.
export default function NewProcessSheet({ uid, processes, onClose, onCreated }) {
  const showToast = useToast()
  const { confirm } = useDialog()
  const [type, setType] = useState('import')
  const [form, setForm] = useState(EMPTY)
  const [unidades, setUnidades] = useState(() => [novaUnidade()])
  const [saving, setSaving] = useState(false)
  const [armadorFaltando, setArmadorFaltando] = useState(false)
  const isImport = type === 'import'

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))
  const text = (field, placeholder, extra = {}) => (
    <input
      id={`np-${field}`}
      value={form[field]}
      onChange={(e) => set(field)(e.target.value)}
      maxLength={150}
      placeholder={placeholder}
      className="field-plain text-right"
      {...extra}
    />
  )
  const setUnidade = (key, field, value) => setUnidades((us) => us.map((u) => (u.key === key ? { ...u, [field]: value } : u)))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.armador) {
      setArmadorFaltando(true)
      showToast('Selecione o armador.', 'error')
      return
    }
    const data = {
      userId: uid,
      type,
      status: 'active',
      createdAt: new Date().toISOString(),
      armador: form.armador,
      motorista: form.motorista,
      placas: form.placas,
      observacoes: form.observacoes,
      ...(isImport
        ? {
            importador: form.importador,
            documentoTipo: form.documentoTipo,
            documentoNumero: form.documentoNumero,
            termCarga: form.termCarga,
            termVazio: form.termVazio,
            finalizacaoVazio: form.finalizacaoVazio || 'devolucao',
          }
        : { exportador: form.exportador, referencia: form.referencia, booking: form.booking, navio: form.navio }),
      // Salva mesmo vazio: o número/tipo podem ser preenchidos depois no processo.
      containers: unidades.map((u, i) => novoContainer(type, `c_${Date.now()}_${i}`, u.numero.trim(), u.tipo.trim())),
    }

    // VERIFICAÇÃO DE DUPLICIDADE: avisa (sem bloquear) quando contêiner,
    // documento ou booking já existem em outro processo ativo.
    const ativos = processes.filter((p) => p.status !== 'archived')
    const motivos = []
    const ctDup = data.containers.map((c) => c.numero).filter(Boolean).find((n) => numeroContainerDuplicado(processes, n))
    if (ctDup) motivos.push(`o contêiner "${ctDup}"`)
    if (isImport && data.documentoNumero && ativos.some((p) => p.type === 'import' && p.documentoNumero === data.documentoNumero)) {
      motivos.push(`o documento "${data.documentoNumero}"`)
    } else if (!isImport && data.booking && ativos.some((p) => p.type === 'export' && p.booking === data.booking)) {
      motivos.push(`o booking "${data.booking}"`)
    }
    if (motivos.length) {
      const ok = await confirm({
        title: 'Possível duplicidade',
        message: `Já existe um processo ativo usando ${motivos.join(' e ')}. Deseja criar mesmo assim?`,
        confirmLabel: 'Criar mesmo assim',
      })
      if (!ok) return
    }

    setSaving(true)
    try {
      await criarProcesso(data)
      showToast('Processo criado.')
      onCreated(type)
    } catch (error) {
      console.error('Erro ao salvar:', error)
      showToast('Não foi possível criar o processo. Verifique a conexão e tente de novo.', 'error')
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose} title="Novo processo" size="md" sheet grouped>
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <SheetHeader
          title="Novo processo"
          left={<Button variant="plain" className="px-1" onClick={onClose}>Cancelar</Button>}
          right={<Button type="submit" variant="plain" className="px-1 font-semibold" loading={saving}>Criar</Button>}
        />
        <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-4 pb-10 pt-2 sm:px-5">
          <Segmented
            options={[
              { value: 'import', label: 'Importação', icon: ArrowDownToLine },
              { value: 'export', label: 'Exportação', icon: ArrowUpFromLine },
            ]}
            value={type}
            onChange={(t) => (setType(t), setUnidades([novaUnidade()]))}
          />

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={type}
              initial={{ opacity: 0, x: isImport ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isImport ? 10 : -10 }}
              transition={{ duration: 0.16 }}
              className="space-y-6"
            >
              <Group title="Processo">
                {isImport ? (
                  <>
                    <Row label="Importador" htmlFor="np-importador">{text('importador', 'Nome', { 'data-autofocus': true })}</Row>
                    <Row label="Documento">
                      <Segmented size="sm" className="w-48" options={DOC_TIPOS} value={form.documentoTipo} onChange={set('documentoTipo')} />
                    </Row>
                    <Row label="Número" htmlFor="np-documentoNumero">{text('documentoNumero', form.documentoTipo ? `Nº da ${form.documentoTipo}` : 'Nº do documento')}</Row>
                  </>
                ) : (
                  <>
                    <Row label="Exportador" htmlFor="np-exportador">{text('exportador', 'Nome', { 'data-autofocus': true })}</Row>
                    <Row label="Booking" htmlFor="np-booking">{text('booking', 'Número')}</Row>
                    <Row label="Referência" htmlFor="np-referencia">{text('referencia', 'Opcional')}</Row>
                    <Row label="Navio" htmlFor="np-navio">{text('navio', 'Nome do navio')}</Row>
                  </>
                )}
                <Row label={<span className={armadorFaltando && !form.armador ? 'text-red-500' : ''}>Armador</span>}>
                  <RegistrySelect variant="plain" cat="armador" value={form.armador} onChange={set('armador')} placeholder="Obrigatório" />
                </Row>
              </Group>

              <Group title="Transporte">
                <Row label="Motorista" htmlFor="np-motorista">{text('motorista', 'Nome')}</Row>
                <Row label="Placas" htmlFor="np-placas">{text('placas', 'ABC1D23')}</Row>
                {isImport && (
                  <>
                    <Row label="Carregamento"><RegistrySelect variant="plain" cat="cheio" value={form.termCarga} onChange={set('termCarga')} placeholder="Terminal" /></Row>
                    <Row label="Vazio"><RegistrySelect variant="plain" cat="vazio" value={form.termVazio} onChange={set('termVazio')} placeholder="Terminal" /></Row>
                    <Row label="Destino">
                      <Segmented size="sm" className="w-56" options={DESTINOS} value={form.finalizacaoVazio} onChange={set('finalizacaoVazio')} />
                    </Row>
                  </>
                )}
              </Group>
            </motion.div>
          </AnimatePresence>

          <Group title="Contêineres" footer="Opcional. Dá para adicionar ou editar depois, abrindo o processo.">
            <AnimatePresence initial={false}>
              {unidades.map((u, i) => {
                const invalido = validarNumeroContainer(u.numero) === false
                return (
                  <motion.div key={u.key} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="flex min-h-11 items-center gap-3 px-4 py-1.5">
                      <button
                        type="button"
                        aria-label={`Remover contêiner ${i + 1}`}
                        onClick={() => setUnidades((us) => us.filter((x) => x.key !== u.key))}
                        className="shrink-0 text-red-500 transition-transform active:scale-90"
                      >
                        <CircleMinus className="size-5 fill-red-500 text-white dark:text-navy-800" strokeWidth={2} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <input
                          type="text"
                          placeholder="ABCD 123.456-7"
                          maxLength={15}
                          value={u.numero}
                          onChange={(e) => setUnidade(u.key, 'numero', mascaraNumeroContainer(e.target.value))}
                          className="field-plain font-mono text-[14px]"
                        />
                        {invalido && <p className="text-[11px] text-red-500">Dígito verificador não confere</p>}
                      </div>
                      <div className="w-32 shrink-0">
                        <RegistrySelect variant="plain" cat="tipo" value={u.tipo} onChange={(v) => setUnidade(u.key, 'tipo', v)} placeholder="Tipo" />
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            <button
              type="button"
              onClick={() => setUnidades((us) => [...us, novaUnidade()])}
              className="flex min-h-11 w-full items-center gap-3 px-4 text-left text-[15px] text-blue-500 transition-colors hover:bg-navy-700/40"
            >
              <CirclePlus className="size-5 fill-emerald-500 text-white dark:text-navy-800" strokeWidth={2} />
              Adicionar contêiner
            </button>
          </Group>

          <Group title="Observações">
            <div className="px-4 py-3">
              <textarea
                rows={3}
                maxLength={1000}
                value={form.observacoes}
                onChange={(e) => set('observacoes')(e.target.value)}
                placeholder="Recados rápidos para a equipe (opcional)"
                className="field-plain resize-none"
              />
            </div>
          </Group>
        </div>
      </form>
    </Modal>
  )
}
