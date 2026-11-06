import { addDoc, collection, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from './banco'
import { trackSave } from './saveStatus'

// PENDÊNCIAS (coleção "pendencias", compartilhada com a equipe): gravações no
// Firestore. As regras puras (agrupar, validar, rótulos) estão em pendencias.js.
// Cada documento: { titulo, data (AAAA-MM-DD), feito, feitoEm, feitoPor,
// processoId, processoRotulo, ordem (posição no dia, opcional), createdAt,
// updatedAt, updatedBy }.

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

// `diaAnterior`: se a pendência mudou de dia, perde a posição e vai para o fim do novo dia.
export const atualizarPendencia = (id, dados, email, diaAnterior) =>
  trackSave(
    updateDoc(doc(db, 'pendencias', id), {
      ...camposEditaveis(dados),
      ...(diaAnterior && dados.data !== diaAnterior ? { ordem: null } : {}),
      updatedAt: agora(),
      updatedBy: email,
    })
  )

// Grava a ordem de um dia (arrastar para reordenar), tudo de uma vez: [{ id, ordem }].
// Só mexe no campo "ordem" (não conta como edição da pendência).
export const salvarOrdem = (mudancas) => {
  const lote = writeBatch(db)
  mudancas.forEach(({ id, ordem }) => lote.update(doc(db, 'pendencias', id), { ordem }))
  return trackSave(lote.commit())
}

// Marca ou desmarca como feita: mexe só em feito/feitoEm/feitoPor (não sobrescreve o título).
export const marcarFeita = (id, feito, email) => {
  const t = agora()
  return trackSave(
    updateDoc(doc(db, 'pendencias', id), { feito, feitoEm: feito ? t : null, feitoPor: feito ? email : null, updatedAt: t, updatedBy: email })
  )
}

export const excluirPendencia = (id) => deleteDoc(doc(db, 'pendencias', id))
