import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from './banco'
import { trackSave } from './saveStatus'

// PENDÊNCIAS (coleção "pendencias", compartilhada com a equipe): gravações no
// Firestore. As regras puras (agrupar, validar, rótulos) estão em pendencias.js.
// Cada documento: { titulo, data (AAAA-MM-DD), feito, feitoEm, feitoPor,
// processoId, processoRotulo, createdAt, updatedAt, updatedBy }.

const pendenciasRef = collection(db, 'pendencias')

const agora = () => new Date().toISOString()

// Só os campos que a pessoa edita (título, dia e vínculo com o processo).
const camposEditaveis = ({ titulo, data, processoId = null, processoRotulo = null }) => ({
  titulo: titulo.trim(),
  data,
  processoId,
  processoRotulo,
})

export const criarPendencia = (dados, email) => {
  const t = agora()
  return trackSave(
    addDoc(pendenciasRef, { ...camposEditaveis(dados), feito: false, feitoEm: null, feitoPor: null, createdAt: t, updatedAt: t, updatedBy: email })
  )
}

export const atualizarPendencia = (id, dados, email) =>
  trackSave(updateDoc(doc(db, 'pendencias', id), { ...camposEditaveis(dados), updatedAt: agora(), updatedBy: email }))

// Marca ou desmarca como feita: mexe só em feito/feitoEm/feitoPor (não sobrescreve o título).
export const marcarFeita = (id, feito, email) => {
  const t = agora()
  return trackSave(
    updateDoc(doc(db, 'pendencias', id), { feito, feitoEm: feito ? t : null, feitoPor: feito ? email : null, updatedAt: t, updatedBy: email })
  )
}

export const excluirPendencia = (id) => deleteDoc(doc(db, 'pendencias', id))
