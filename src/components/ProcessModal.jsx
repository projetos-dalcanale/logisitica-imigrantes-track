import { useEffect, useState } from 'react'
import { useToast } from '../contexts/ToastContext'
import {
  draftAlertConfig,
  getDraftDeadlineInfo,
  mascaraNumeroContainer,
  stepsChecklistImport,
  validarNumeroContainer,
} from '../lib/processos'
import {
  adicionarContainer,
  atualizarCampoContainer,
  atualizarChecklist,
  atualizarProcesso,
  excluirProcesso,
  numeroContainerDuplicado,
  removerContainer,
} from '../lib/processActions'
import { exportarProcessoPDF } from '../lib/exportar'
import AutoSaveInput from './AutoSaveInput'
import RegistrySelect from './RegistrySelect'

const fieldClass = 'w-full bg-navy-800 border border-slate-600 rounded-lg p-2 text-sm text-ink focus:border-blue-500 outline-none transition'
const editClass = 'w-full bg-navy-900 border border-slate-600 rounded-lg p-2 text-sm text-ink focus:border-blue-500 outline-none transition'
const smallClass = 'w-full bg-navy-900 border border-slate-600 rounded-md p-2 text-xs text-ink focus:border-blue-500 outline-none transition'
const labelClass = 'block text-[10px] uppercase text-slate-500 mb-1'

function Label({ children }) {
  return <label className={labelClass}>{children}</label>
}

// "Chips" do cabeçalho (rótulo + valor), com "—" no lugar de campo vazio.
function HeaderChips({ pares }) {
  return pares.map(({ label, value }) => (
    <span key={label} className="inline-flex items-center gap-1 bg-navy-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-300">
      <span className="text-slate-500">{label}:</span> {value || '—'}
    </span>
  ))
}

// Edição dos dados do cabeçalho: Documento/Armador/Terminais/Destino na
// importação; Booking/Ref/Navio/Armador na exportação.
function HeaderEdit({ proc, onDone }) {
  const isImport = proc.type === 'import'
  const [form, setForm] = useState(() =>
    isImport
      ? {
          documentoTipo: proc.documentoTipo || '',
          documentoNumero: proc.documentoNumero || '',
          armador: proc.armador || '',
          termCarga: proc.termCarga || '',
          termVazio: proc.termVazio || '',
          finalizacaoVazio: proc.finalizacaoVazio === 'baixa' ? 'baixa' : 'devolucao',
        }
      : {
          booking: proc.booking || '',
          referencia: proc.referencia || '',
          navio: proc.navio || '',
          armador: proc.armador || '',
        }
  )
  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))
  const setFromEvent = (field) => (e) => set(field)(e.target.value)

  const save = async () => {
    await atualizarProcesso(proc.id, form)
    onDone()
  }

  return (
    <div className="mt-2 bg-navy-800 border border-slate-600 rounded-lg p-3 max-w-xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {isImport ? (
          <>
            <div>
              <Label>Tipo de Documento</Label>
              <select value={form.documentoTipo} onChange={setFromEvent('documentoTipo')} className={editClass}>
                <option value="">Tipo</option>
                <option value="DI">DI</option>
                <option value="DTA">DTA</option>
                <option value="DUIMP">DUIMP</option>
              </select>
            </div>
            <div>
              <Label>Número do Documento</Label>
              <input type="text" maxLength={150} value={form.documentoNumero} onChange={setFromEvent('documentoNumero')} className={editClass} />
            </div>
            <div>
              <Label>Armador</Label>
              <RegistrySelect cat="armador" value={form.armador} onChange={set('armador')} className={editClass} />
            </div>
            <div />
            <div>
              <Label>Terminal de Carregamento</Label>
              <RegistrySelect cat="cheio" value={form.termCarga} onChange={set('termCarga')} className={editClass} />
            </div>
            <div>
              <Label>Terminal de Vazio</Label>
              <RegistrySelect cat="vazio" value={form.termVazio} onChange={set('termVazio')} className={editClass} />
            </div>
            <div>
              <Label>Destino do Contêiner</Label>
              <select value={form.finalizacaoVazio} onChange={setFromEvent('finalizacaoVazio')} className={editClass}>
                <option value="devolucao">Devolução de Vazio</option>
                <option value="baixa">Baixa de Contêiner (sem devolução)</option>
              </select>
            </div>
          </>
        ) : (
          <>
            <div>
              <Label>Booking</Label>
              <input type="text" maxLength={150} value={form.booking} onChange={setFromEvent('booking')} className={editClass} />
            </div>
            <div>
              <Label>Referência</Label>
              <input type="text" maxLength={150} value={form.referencia} onChange={setFromEvent('referencia')} className={editClass} />
            </div>
            <div>
              <Label>Navio</Label>
              <input type="text" maxLength={150} value={form.navio} onChange={setFromEvent('navio')} className={editClass} />
            </div>
            <div>
              <Label>Armador</Label>
              <RegistrySelect cat="armador" value={form.armador} onChange={set('armador')} className={editClass} />
            </div>
          </>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-3">
        <button type="button" onClick={onDone} className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-navy-700 rounded-lg border border-slate-600 transition">Cancelar</button>
        <button type="button" onClick={save} className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition">
          <i className="fas fa-check mr-1" />Salvar
        </button>
      </div>
    </div>
  )
}

function ImportChecklist({ proc, ct, disabled }) {
  return (
    <div className="space-y-2">
      {stepsChecklistImport(proc).map((step) => {
        const val = ct.checklist?.[step.id] || ''
        if (step.type === 'checkbox') {
          const isChecked = val === 'true'
          return (
            <label
              key={step.id}
              className={`flex items-center gap-3 text-sm text-slate-300 p-2.5 rounded-lg cursor-pointer transition border ${isChecked ? 'border-blue-800/40 bg-blue-900/10' : 'border-transparent hover:bg-navy-800 hover:border-slate-700'}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                disabled={disabled}
                onChange={(e) => atualizarChecklist(proc, ct.id, step.id, e.target.checked)}
                className="w-4 h-4 accent-blue-500 bg-navy-800 border-slate-600 rounded"
              />
              <span className={isChecked ? 'text-slate-200' : ''}>{step.label}</span>
            </label>
          )
        }
        const isAgendado = ct.checklist?.[`${step.id}_check`] === 'true'
        return (
          <div
            key={step.id}
            className={`flex flex-wrap gap-2 items-center justify-between text-sm text-slate-300 p-3 rounded-lg border transition-colors ${isAgendado ? 'bg-emerald-900/10 border-emerald-800/40' : 'bg-navy-800 border-slate-700'}`}
          >
            <span className={`font-medium ${isAgendado ? 'text-slate-200' : ''}`}>{step.label}</span>
            <div className="flex items-center gap-2">
              <AutoSaveInput
                type="datetime-local"
                saveOnChange
                value={val}
                disabled={disabled}
                onSave={(v) => atualizarChecklist(proc, ct.id, step.id, v)}
                className="bg-navy-900 border border-slate-600 rounded-md p-1.5 text-xs text-ink focus:border-blue-500 outline-none w-44 transition"
              />
              <label className="flex items-center gap-1 cursor-pointer" title="Marcar como agendado">
                <input
                  type="checkbox"
                  checked={isAgendado}
                  disabled={disabled}
                  onChange={(e) => atualizarChecklist(proc, ct.id, `${step.id}_check`, e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 bg-navy-800 border-slate-600 rounded"
                />
              </label>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ExportDeadlines({ proc, ct, disabled }) {
  const save = (field) => (v) => atualizarCampoContainer(proc, ct.id, field, v)
  const boxClass = 'bg-navy-800 p-3 rounded-lg border border-slate-700'
  const boxLabel = 'block text-[10px] uppercase font-bold text-slate-400 mb-2'
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
      <div className={boxClass}>
        <label className={boxLabel}>Deadline Draft</label>
        <AutoSaveInput type="datetime-local" saveOnChange value={ct.deadlineDraft} disabled={disabled} onSave={save('deadlineDraft')} className={smallClass} />
      </div>
      <div className={boxClass}>
        <label className={boxLabel}>Deadline Carga</label>
        <AutoSaveInput type="datetime-local" saveOnChange value={ct.deadlineCarga} disabled={disabled} onSave={save('deadlineCarga')} className={smallClass} />
      </div>
      <div className={boxClass}>
        <label className={boxLabel}>Retirada Vazio</label>
        <div className="flex flex-col gap-2">
          <RegistrySelect cat="vazio" value={ct.termVazioExp} disabled={disabled} onChange={save('termVazioExp')} className={smallClass} />
          <AutoSaveInput type="datetime-local" saveOnChange value={ct.agVazio} disabled={disabled} onSave={save('agVazio')} className={smallClass} />
        </div>
      </div>
      <div className={boxClass}>
        <label className={boxLabel}>Depósito Cheio</label>
        <div className="flex flex-col gap-2">
          <RegistrySelect cat="cheio" value={ct.termCheioExp} disabled={disabled} onChange={save('termCheioExp')} className={smallClass} />
          <AutoSaveInput type="datetime-local" saveOnChange value={ct.agCheio} disabled={disabled} onSave={save('agCheio')} className={smallClass} />
        </div>
      </div>
    </div>
  )
}

function ContainerBlock({ proc, ct, index, processes, disabled }) {
  const showToast = useToast()
  const [numeroDigitado, setNumeroDigitado] = useState(ct.numero || '')
  const [numeroSalvo, setNumeroSalvo] = useState(ct.numero)
  if (ct.numero !== numeroSalvo) {
    setNumeroSalvo(ct.numero)
    setNumeroDigitado(ct.numero || '')
  }
  const save = (field) => (v) => atualizarCampoContainer(proc, ct.id, field, v)

  // Avisa (sem bloquear) se outro processo ativo já usa o número.
  const saveNumero = async (value) => {
    if (value && numeroContainerDuplicado(processes, value, { procId: proc.id, ctId: ct.id })) {
      if (!window.confirm(`Já existe outro processo ativo usando o número de contêiner "${value}". Deseja salvar mesmo assim?`)) {
        setNumeroDigitado(ct.numero || '')
        return false
      }
    }
    await save('numero')(value)
  }

  const remover = async () => {
    if (!window.confirm('Remover este contêiner do processo?')) return
    await removerContainer(proc, ct.id)
    showToast('Contêiner removido.')
  }

  return (
    <div className="bg-navy-900 p-5 rounded-xl shadow-inner border border-slate-700 mb-5 relative">
      <div className="border-b border-slate-700 pb-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Contêiner {index + 1}</span>
          {!disabled && (
            <button onClick={remover} title="Remover" className="w-7 h-7 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition flex items-center justify-center">
              <i className="fas fa-trash text-xs" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Numeração</Label>
            <AutoSaveInput
              type="text"
              placeholder="ABCD 123.456-7"
              maxLength={15}
              value={ct.numero}
              transform={(v) => {
                const m = mascaraNumeroContainer(v)
                setNumeroDigitado(m)
                return m
              }}
              disabled={disabled}
              onSave={saveNumero}
              className={fieldClass}
            />
            {validarNumeroContainer(numeroDigitado) === false && (
              <p className="text-[10px] text-red-400 mt-1 leading-tight">Dígito verificador não confere.</p>
            )}
          </div>
          <div>
            <Label>Tipo / Equipamento</Label>
            <RegistrySelect cat="tipo" value={ct.tipo} disabled={disabled} onChange={save('tipo')} className={fieldClass} />
          </div>
        </div>
        {proc.type === 'export' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div>
              <Label>Tara</Label>
              <AutoSaveInput type="text" placeholder="Tara" value={ct.tara} disabled={disabled} onSave={save('tara')} className={fieldClass} />
            </div>
            <div>
              <Label>Lacre</Label>
              <AutoSaveInput type="text" placeholder="Lacre" value={ct.lacre} disabled={disabled} onSave={save('lacre')} className={fieldClass} />
            </div>
          </div>
        )}
      </div>
      {proc.type === 'import' ? (
        <ImportChecklist proc={proc} ct={ct} disabled={disabled} />
      ) : (
        <ExportDeadlines proc={proc} ct={ct} disabled={disabled} />
      )}
    </div>
  )
}

// MODAL DE DETALHES DO PROCESSO. Tudo salva sozinho no Firestore, e o modal
// acompanha em tempo real alterações feitas em outra aba/dispositivo.
export default function ProcessModal({ proc, processes, onClose }) {
  const showToast = useToast()
  const [editingHeader, setEditingHeader] = useState(false)
  const isImport = proc.type === 'import'
  const archived = proc.status === 'archived'
  const containers = proc.containers || []
  const draftInfo = getDraftDeadlineInfo(proc)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const chips = isImport
    ? [
        ...(proc.documentoTipo
          ? [{ label: proc.documentoTipo, value: proc.documentoNumero }]
          : proc.documento ? [{ label: 'Documento', value: proc.documento }] : []),
        { label: 'Armador', value: proc.armador },
        { label: 'Carga', value: proc.termCarga },
        { label: 'Vazio', value: proc.termVazio },
        { label: 'Destino', value: proc.finalizacaoVazio === 'baixa' ? 'Baixa de Contêiner' : 'Devolução de Vazio' },
      ]
    : [
        { label: 'Booking', value: proc.booking },
        { label: 'Ref', value: proc.referencia },
        { label: 'Navio', value: proc.navio },
        { label: 'Armador', value: proc.armador },
      ]

  const setStatus = async (status, pergunta, mensagem) => {
    if (!window.confirm(pergunta)) return
    await atualizarProcesso(proc.id, { status })
    onClose()
    showToast(mensagem)
  }

  const excluir = async () => {
    if (!window.confirm('Tem certeza que deseja EXCLUIR este processo? Essa ação não pode ser desfeita.')) return
    try {
      await excluirProcesso(proc.id)
      onClose()
      showToast('Processo excluído.')
    } catch (error) {
      console.error('Erro ao excluir:', error)
      showToast('Erro ao excluir processo. Verifique as regras de segurança do Firestore.', 'error')
    }
  }

  const saveProcField = (field) => (v) => atualizarProcesso(proc.id, { [field]: v })

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="modal-in bg-navy-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-slate-700 overflow-hidden">
        <div className="bg-navy-900 p-5 border-b border-slate-700 flex justify-between items-start">
          <div className="min-w-0">
            <div className="flex gap-3 items-center mb-1">
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-900/50 text-blue-400 border border-blue-800 uppercase tracking-wider">{proc.type}</span>
              <h2 className="text-2xl font-bold text-ink tracking-tight">
                {isImport ? proc.importador || 'Processo de Importação' : proc.exportador || 'Processo de Exportação'}
              </h2>
            </div>
            {editingHeader ? (
              <HeaderEdit proc={proc} onDone={() => setEditingHeader(false)} />
            ) : (
              <div className="flex items-start gap-2 mt-1">
                <p className="flex flex-wrap gap-1.5 items-center text-sm text-slate-400">
                  <HeaderChips pares={chips} />
                </p>
                {!archived && (
                  <button onClick={() => setEditingHeader(true)} title="Editar" className="text-slate-500 hover:text-blue-400 transition shrink-0 mt-0.5">
                    <i className="fas fa-pen text-xs" />
                  </button>
                )}
              </div>
            )}
          </div>
          <button onClick={onClose} title="Fechar" className="w-9 h-9 rounded-full text-slate-500 hover:text-ink hover:bg-navy-700 text-xl transition flex items-center justify-center shrink-0">
            &times;
          </button>
        </div>

        {draftInfo && (
          <div className={`rounded-r-lg mx-5 mt-5 p-4 border-l-4 ${draftAlertConfig[draftInfo.nivel].box}`}>
            <div className="flex">
              <i className={`fas ${draftAlertConfig[draftInfo.nivel].icon} ${draftAlertConfig[draftInfo.nivel].iconColor} mt-0.5`} />
              <p className={`ml-3 text-sm font-bold ${draftAlertConfig[draftInfo.nivel].text}`}>{draftInfo.texto}</p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 bg-navy-800 custom-scrollbar">
          <div className="bg-navy-900 p-4 rounded-xl border border-slate-700 mb-6">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Motorista / Veículo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Motorista</Label>
                <AutoSaveInput type="text" placeholder="Nome do motorista" maxLength={150} value={proc.motorista} disabled={archived} onSave={saveProcField('motorista')} className={fieldClass} />
              </div>
              <div>
                <Label>Placas</Label>
                <AutoSaveInput type="text" placeholder="Ex: ABC1D23 e XYZ9F87" maxLength={150} value={proc.placas} disabled={archived} onSave={saveProcField('placas')} className={fieldClass} />
              </div>
            </div>
          </div>

          <div className="bg-navy-900 p-4 rounded-xl border border-slate-700 mb-6">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Observações</h3>
            <AutoSaveInput
              as="textarea"
              placeholder="Recados rápidos para a equipe (ex: aguardando liberação da Receita)..."
              maxLength={1000}
              rows={3}
              value={proc.observacoes}
              disabled={archived}
              onSave={saveProcField('observacoes')}
              className="w-full bg-navy-800 border border-slate-600 rounded-lg p-2.5 text-sm text-ink focus:border-blue-500 outline-none transition resize-none"
            />
          </div>

          {!archived && (
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-ink tracking-tight">Unidades ({containers.length})</h3>
              <button onClick={() => adicionarContainer(proc)} className="bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-sm font-semibold px-4 py-2 rounded-lg shadow transition">
                <i className="fas fa-plus mr-2" />Novo Contêiner
              </button>
            </div>
          )}

          {containers.length === 0 && (
            <div className="text-center p-8 text-slate-500 border border-dashed border-slate-700 rounded-xl">Nenhum contêiner adicionado a este processo.</div>
          )}

          {containers.map((ct, index) => (
            <ContainerBlock key={ct.id} proc={proc} ct={ct} index={index} processes={processes} disabled={archived} />
          ))}
        </div>

        <div className="p-5 border-t border-slate-700 bg-navy-900 flex flex-wrap justify-between items-center gap-3">
          <button onClick={excluir} className="px-5 py-2.5 text-red-400 font-semibold hover:bg-red-900/20 rounded-lg transition border border-red-900/50 hover:border-red-700">
            <i className="fas fa-trash mr-2" /> Excluir Processo
          </button>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => exportarProcessoPDF(proc)} className="px-5 py-2.5 text-slate-300 font-semibold hover:bg-navy-700 rounded-lg transition border border-slate-600">
              <i className="fas fa-file-pdf mr-2" /> Exportar PDF
            </button>
            <button onClick={onClose} className="px-5 py-2.5 text-slate-300 font-semibold hover:bg-navy-700 rounded-lg transition border border-transparent hover:border-slate-600">Fechar</button>
            {archived ? (
              <button
                onClick={() => setStatus('active', 'Deseja mover este processo de volta para a lista de Ativos?', 'Processo restaurado para Ativos.')}
                className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-900/30 hover:bg-blue-500 transition"
              >
                <i className="fas fa-box-open mr-2" /> Desarquivar Processo
              </button>
            ) : (
              <button
                onClick={() => setStatus('archived', 'Tem certeza que deseja mover este processo para Arquivados?', 'Processo movido para Arquivados.')}
                className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-lg shadow-lg shadow-emerald-900/30 hover:bg-emerald-500 transition"
              >
                <i className="fas fa-check-double mr-2" /> Arquivar Processo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
