import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import { trackSave } from './saveStatus'

// ROTAS E VALORES DE PEDÁGIO (coleção "pedagios", compartilhada com a equipe).
// Cada documento: { nome (opcional, ex: "GJA X SP 05 eixos"), origem, pontos (paradas entre origem e destino), destino, idaVolta, eixos, kmPrevisto, valorTotal,
// createdAt, updatedAt, updatedBy }. `valorTotal` é o pedágio da rota inteira
// (já considerando ida e volta, quando marcado).

export const novaRota = () => ({ nome: '', origem: '', pontos: [], destino: '', idaVolta: false, eixos: 0, kmPrevisto: 0, valorTotal: 0 })

const pedagiosRef = collection(db, 'pedagios')

export const criarPedagio = (data, email) => {
  const agora = new Date().toISOString()
  return trackSave(addDoc(pedagiosRef, { ...data, createdAt: agora, updatedAt: agora, updatedBy: email }))
}

export const atualizarPedagio = (id, data, email) =>
  trackSave(updateDoc(doc(db, 'pedagios', id), { ...data, updatedAt: new Date().toISOString(), updatedBy: email }))

export const excluirPedagio = (id) => deleteDoc(doc(db, 'pedagios', id))
