import { useState } from 'react'
import { useToast } from '../contexts/ToastContext'
import { criarProcesso, novoContainer, numeroContainerDuplicado } from '../lib/processActions'
import { mascaraNumeroContainer, validarNumeroContainer } from '../lib/processos'
import RegistrySelect from './RegistrySelect'

const inputClass = 'w-full p-2.5 text-sm border border-slate-600 rounded-lg bg-navy-700 text-ink focus:border-blue-400 outline-none transition'
const ctInputClass = 'w-full p-2 text-xs border border-slate-600 bg-navy-700 text-ink rounded-md outline-none focus:border-blue-500 transition'

const EMPTY = {
  armador: '', motorista: '', placas: '', observacoes: '',
  importador: '', documentoTipo: '', documentoNumero: '', termCarga: '', termVazio: '', finalizacaoVazio: 'devolucao',
  exportador: '', referencia: '', booking: '', navio: '',
}

let unidadeSeq = 0
const novaUnidade = () => ({ key: ++unidadeSeq, numero: '', tipo: '' })

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

// FORMULÁRIO DE NOVO PROCESSO (menu lateral). Contêineres são opcionais:
// dá pra adicionar/editar depois, abrindo o processo.
export default function NewProcessForm({ uid, processes, onCreated }) {
  const showToast = useToast()
  const [type, setType] = useState('import')
  const [form, setForm] = useState(EMPTY)
  const [unidades, setUnidades] = useState(() => [novaUnidade()])
  const [saving, setSaving] = useState(false)

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))
  const bind = (field) => ({ value: form[field], onChange: (e) => set(field)(e.target.value) })

  const switchType = (t) => {
    setType(t)
    setUnidades([novaUnidade()])
  }

  const setUnidade = (key, field, value) =>
    setUnidades((us) => us.map((u) => (u.key === key ? { ...u, [field]: value } : u)))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const isImport = type === 'import'
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
        : {
            exportador: form.exportador,
            referencia: form.referencia,
            booking: form.booking,
            navio: form.navio,
          }),
      // Salva mesmo vazio: o número/tipo podem ser preenchidos depois no modal.
      containers: unidades.map((u, i) => novoContainer(type, `c_${Date.now()}_${i}`, u.numero.trim(), u.tipo.trim())),
    }

    // VERIFICAÇÃO DE DUPLICIDADE: avisa (sem bloquear) quando contêiner,
    // documento ou booking já existem em outro processo ativo.
    const ativos = processes.filter((p) => p.status !== 'archived')
    const motivos = []
    const ctDup = data.containers.map((c) => c.numero).filter(Boolean).find((n) => numeroContainerDuplicado(processes, n))
    if (ctDup) motivos.push(`o número de contêiner "${ctDup}"`)
    if (isImport && data.documentoNumero && ativos.some((p) => p.type === 'import' && p.documentoNumero === data.documentoNumero)) {
      motivos.push(`o número de documento "${data.documentoNumero}"`)
    } else if (!isImport && data.booking && ativos.some((p) => p.type === 'export' && p.booking === data.booking)) {
      motivos.push(`o número de booking "${data.booking}"`)
    }
    if (motivos.length && !window.confirm(`Já existe um processo ativo usando ${motivos.join(' e ')}. Deseja criar mesmo assim?`)) {
      return
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

  const typeBtn = (t, label) => (
    <button
      type="button"
      onClick={() => switchType(t)}
      className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${type === t ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-ink'}`}
    >
      {label}
    </button>
  )

  return (
    <>
      <div className="flex gap-1 mb-6 bg-navy-900 p-1 rounded-lg border border-slate-700">
        {typeBtn('import', 'Importação')}
        {typeBtn('export', 'Exportação')}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Armador">
          <RegistrySelect cat="armador" value={form.armador} onChange={set('armador')} required className={inputClass} />
        </Field>

        {type === 'import' ? (
          <>
            <Field label="Importador">
              <input type="text" maxLength={150} {...bind('importador')} className={inputClass} />
            </Field>
            <Field label="DI / DTA / DUIMP">
              <div className="flex gap-2">
                <select {...bind('documentoTipo')} className={inputClass.replace('w-full', 'w-28 shrink-0')}>
                  <option value="">Tipo</option>
                  <option value="DI">DI</option>
                  <option value="DTA">DTA</option>
                  <option value="DUIMP">DUIMP</option>
                </select>
                <input type="text" maxLength={150} placeholder="Número do documento" {...bind('documentoNumero')} className={`${inputClass} flex-1 min-w-0`} />
              </div>
            </Field>
          </>
        ) : (
          <>
            <Field label="Exportador">
              <input type="text" maxLength={150} {...bind('exportador')} className={inputClass} />
            </Field>
            <Field label="Referência do Processo">
              <input type="text" maxLength={150} {...bind('referencia')} className={inputClass} />
            </Field>
            <Field label="Número do Booking">
              <input type="text" maxLength={150} {...bind('booking')} className={inputClass} />
            </Field>
            <Field label="Nome do Navio">
              <input type="text" maxLength={150} {...bind('navio')} className={inputClass} />
            </Field>
          </>
        )}

        <Field label="Motorista">
          <input type="text" maxLength={150} {...bind('motorista')} className={inputClass} />
        </Field>
        <Field label="Placas do Caminhão">
          <input type="text" maxLength={150} placeholder="Ex: ABC1D23 e XYZ9F87" {...bind('placas')} className={inputClass} />
        </Field>
        <Field label="Observações">
          <textarea maxLength={1000} rows={2} placeholder="Recados rápidos para a equipe (opcional)" {...bind('observacoes')} className={`${inputClass} resize-none`} />
        </Field>

        {type === 'import' && (
          <>
            <Field label="Terminal de Carregamento">
              <RegistrySelect cat="cheio" value={form.termCarga} onChange={set('termCarga')} className={inputClass} />
            </Field>
            <Field label="Terminal de Vazio">
              <RegistrySelect cat="vazio" value={form.termVazio} onChange={set('termVazio')} className={inputClass} />
            </Field>
            <Field label="Destino do Contêiner">
              <select {...bind('finalizacaoVazio')} className={inputClass}>
                <option value="devolucao">Devolução de Vazio</option>
                <option value="baixa">Baixa de Contêiner (sem devolução)</option>
              </select>
            </Field>
          </>
        )}

        <div className="border-t border-slate-700 pt-5 mt-5">
          <h3 className="text-sm font-bold text-ink mb-3 flex justify-between items-center">
            Contêineres Iniciais
            <button type="button" onClick={() => setUnidades((us) => [...us, novaUnidade()])} className="text-blue-400 hover:text-blue-300 text-xs font-semibold transition flex items-center gap-1">
              <i className="fas fa-plus text-[10px]" /> Adicionar
            </button>
          </h3>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">Opcional: você pode adicionar ou editar contêineres e lacres depois, abrindo o processo.</p>
          <div className="space-y-3">
            {unidades.map((u, i) => (
              <div key={u.key} className="bg-navy-900 p-3 rounded-lg border border-slate-700 relative">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unidade {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => setUnidades((us) => us.filter((x) => x.key !== u.key))}
                    className="w-6 h-6 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-900/20 text-xs transition flex items-center justify-center"
                  >
                    <i className="fas fa-trash" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <input
                      type="text"
                      placeholder="ABCD 123.456-7"
                      maxLength={15}
                      value={u.numero}
                      onChange={(e) => setUnidade(u.key, 'numero', mascaraNumeroContainer(e.target.value))}
                      className={ctInputClass}
                    />
                    {validarNumeroContainer(u.numero) === false && (
                      <p className="text-[10px] text-red-400 mt-1 leading-tight">Dígito verificador não confere.</p>
                    )}
                  </div>
                  <RegistrySelect cat="tipo" value={u.tipo} onChange={(v) => setUnidade(u.key, 'tipo', v)} className={ctInputClass} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg mt-8 hover:bg-blue-500 active:scale-[0.99] shadow-lg shadow-blue-900/50 transition disabled:opacity-70">
          {saving ? <><i className="fas fa-spinner fa-spin" /> Criando...</> : 'Criar Processo'}
        </button>
      </form>
    </>
  )
}
