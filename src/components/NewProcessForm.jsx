import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowDownToLine, ArrowUpFromLine, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { useDialog } from '../contexts/DialogContext'
import { criarProcesso, novoContainer, numeroContainerDuplicado } from '../lib/processActions'
import { mascaraNumeroContainer, validarNumeroContainer } from '../lib/processos'
import RegistrySelect from './RegistrySelect'
import { DESTINOS, DOC_TIPOS } from './ProcessModal'
import Button from './ui/Button'
import Segmented from './ui/Segmented'
import { IconButton } from './ui/Tooltip'

const EMPTY = {
  armador: '', motorista: '', placas: '', observacoes: '',
  importador: '', documentoTipo: '', documentoNumero: '', termCarga: '', termVazio: '', finalizacaoVazio: 'devolucao',
  exportador: '', referencia: '', booking: '', navio: '',
}

let unidadeSeq = 0
const novaUnidade = () => ({ key: ++unidadeSeq, numero: '', tipo: '' })

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="label">
        {label}
        {hint && <span className="ml-1 font-normal normal-case tracking-normal text-slate-500/80">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

function Group({ title, children }) {
  return (
    <fieldset className="space-y-3.5">
      <legend className="mb-3 flex w-full items-center gap-3 text-[13px] font-semibold text-ink">{title}<span className="h-px flex-1 bg-slate-700/70" /></legend>
      {children}
    </fieldset>
  )
}

// FORMULÁRIO DE NOVO PROCESSO (menu lateral no desktop, tela cheia no
// celular). Contêineres são opcionais: dá pra adicionar depois no processo.
export default function NewProcessForm({ uid, processes, onCreated }) {
  const showToast = useToast()
  const { confirm } = useDialog()
  const [type, setType] = useState('import')
  const [form, setForm] = useState(EMPTY)
  const [unidades, setUnidades] = useState(() => [novaUnidade()])
  const [saving, setSaving] = useState(false)
  const [armadorFaltando, setArmadorFaltando] = useState(false)

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))
  const bind = (field) => ({ value: form[field], onChange: (e) => set(field)(e.target.value), maxLength: 150, className: 'field' })
  const isImport = type === 'import'

  const switchType = (t) => {
    setType(t)
    setUnidades([novaUnidade()])
  }
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
      // Salva mesmo vazio: o número/tipo podem ser preenchidos depois no modal.
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
      setForm(EMPTY)
      setUnidades([novaUnidade()])
      onCreated(type)
      showToast('Processo criado com sucesso.')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      showToast('Erro ao criar processo.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <Segmented
        options={[
          { value: 'import', label: 'Importação', icon: ArrowDownToLine },
          { value: 'export', label: 'Exportação', icon: ArrowUpFromLine },
        ]}
        value={type}
        onChange={switchType}
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={type}
          initial={{ opacity: 0, x: isImport ? -8 : 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isImport ? 8 : -8 }}
          transition={{ duration: 0.16 }}
          className="space-y-7"
        >
          <Group title="Dados do processo">
            {isImport ? (
              <>
                <Field label="Importador"><input id="np-nome" placeholder="Nome do importador" {...bind('importador')} /></Field>
                <Field label="Documento">
                  <Segmented size="sm" className="mb-2" options={DOC_TIPOS} value={form.documentoTipo} onChange={set('documentoTipo')} />
                  <input placeholder={form.documentoTipo ? `Número da ${form.documentoTipo}` : 'Número do documento'} {...bind('documentoNumero')} />
                </Field>
              </>
            ) : (
              <>
                <Field label="Exportador"><input id="np-nome" placeholder="Nome do exportador" {...bind('exportador')} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Booking"><input {...bind('booking')} /></Field>
                  <Field label="Referência"><input {...bind('referencia')} /></Field>
                </div>
                <Field label="Navio"><input placeholder="Nome do navio" {...bind('navio')} /></Field>
              </>
            )}
            <Field label="Armador">
              <div className={armadorFaltando && !form.armador ? 'rounded-[10px] ring-2 ring-red-400/50' : ''}>
                <RegistrySelect cat="armador" value={form.armador} onChange={set('armador')} />
              </div>
            </Field>
          </Group>

          <Group title="Transporte">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Motorista"><input placeholder="Nome" {...bind('motorista')} /></Field>
              <Field label="Placas"><input placeholder="ABC1D23" {...bind('placas')} /></Field>
            </div>
            {isImport && (
              <>
                <Field label="Terminal de carregamento"><RegistrySelect cat="cheio" value={form.termCarga} onChange={set('termCarga')} /></Field>
                <Field label="Terminal de vazio"><RegistrySelect cat="vazio" value={form.termVazio} onChange={set('termVazio')} /></Field>
                <Field label="Destino do contêiner">
                  <Segmented size="sm" options={DESTINOS} value={form.finalizacaoVazio} onChange={set('finalizacaoVazio')} />
                </Field>
              </>
            )}
            <Field label="Observações" hint="(opcional)">
              <textarea rows={2} placeholder="Recados rápidos para a equipe" {...bind('observacoes')} maxLength={1000} className="field resize-none" />
            </Field>
          </Group>
        </motion.div>
      </AnimatePresence>

      <Group title="Contêineres">
        <p className="-mt-1 text-xs leading-relaxed text-slate-500">Opcional — dá pra adicionar ou editar depois, abrindo o processo.</p>
        <AnimatePresence initial={false}>
          {unidades.map((u, i) => {
            const invalido = validarNumeroContainer(u.numero) === false
            return (
              <motion.div
                key={u.key}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-2.5 w-4 shrink-0 text-center text-xs font-semibold tabular-nums text-slate-500">{i + 1}</span>
                  <div className="grid flex-1 grid-cols-[1.2fr_1fr] gap-2">
                    <div>
                      <input
                        type="text"
                        placeholder="ABCD 123.456-7"
                        maxLength={15}
                        value={u.numero}
                        onChange={(e) => setUnidade(u.key, 'numero', mascaraNumeroContainer(e.target.value))}
                        className={`field field-sm font-mono ${invalido ? 'border-red-400/60' : ''}`}
                      />
                      {invalido && <p className="mt-1 text-[11px] text-red-400">Dígito verificador não confere.</p>}
                    </div>
                    <RegistrySelect size="sm" cat="tipo" value={u.tipo} onChange={(v) => setUnidade(u.key, 'tipo', v)} />
                  </div>
                  <IconButton icon={Trash2} size="sm" label="Remover" onClick={() => setUnidades((us) => us.filter((x) => x.key !== u.key))} />
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        <Button variant="ghost" size="sm" icon={Plus} className="text-blue-500 hover:text-blue-400" onClick={() => setUnidades((us) => [...us, novaUnidade()])}>
          Adicionar contêiner
        </Button>
      </Group>

      <Button type="submit" size="lg" loading={saving} className="w-full">
        Criar processo
      </Button>
    </form>
  )
}
