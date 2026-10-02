import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import { novoChecklistImport } from './processos'
import { trackSave } from './saveStatus'

// Gravações no Firestore relacionadas aos processos.

const processRef = (id) => doc(db, 'processes', id)

export const criarProcesso = (data) => addDoc(collection(db, 'processes'), data)
export const atualizarProcesso = (id, data) => trackSave(updateDoc(processRef(id), data))
export const excluirProcesso = (id) => deleteDoc(processRef(id))

// Contêiner "zerado" para o tipo de processo.
export const novoContainer = (type, id, numero = '', tipo = '') => {
  const ct = { id, numero, tipo, motorista: '', placas: '', checklist: {} }
  if (type === 'import') {
    ct.checklist = novoChecklistImport()
  } else {
    Object.assign(ct, {
      tara: '', lacre: '', deadlineDraft: '', deadlineCarga: '',
      agVazio: '', termVazioExp: '', agCheio: '', termCheioExp: '',
    })
  }
  return ct
}

// Altera um campo de um contêiner (ex: numero, tara, deadlineDraft).
export const atualizarCampoContainer = (proc, ctId, field, value) =>
  atualizarProcesso(proc.id, {
    containers: proc.containers.map((c) => (c.id === ctId ? { ...c, [field]: value } : c)),
  })

// Marca/preenche uma etapa do checklist de importação (sempre salvo como texto).
export const atualizarChecklist = (proc, ctId, stepId, value) =>
  atualizarProcesso(proc.id, {
    containers: proc.containers.map((c) =>
      c.id === ctId ? { ...c, checklist: { ...c.checklist, [stepId]: String(value) } } : c
    ),
  })

export const adicionarContainer = (proc) =>
  atualizarProcesso(proc.id, {
    containers: [...(proc.containers || []), novoContainer(proc.type, `c_${Date.now()}_new`)],
  })

export const removerContainer = (proc, ctId) =>
  atualizarProcesso(proc.id, { containers: proc.containers.filter((c) => c.id !== ctId) })

// Outro processo ativo já usa este número de contêiner?
export const numeroContainerDuplicado = (processes, numero, ignorar = {}) =>
  processes.some(
    (p) =>
      p.status !== 'archived' &&
      (p.containers || []).some((c) => c.numero === numero && !(p.id === ignorar.procId && c.id === ignorar.ctId))
  )
