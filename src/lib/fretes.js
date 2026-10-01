import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import { trackSave } from './saveStatus'

// TABELA DE FRETES POR CLIENTE (coleção "fretes", compartilhada com a equipe).
// Cada documento: { cliente, campos: [{ id, label, tipo, valor, custom? }],
// respSeguro, observacoes, createdAt, updatedAt, updatedBy }.

// tipo "moeda" = 2 casas (0,00); tipo "taxa" = 5 casas (0,00000).
export const TIPOS_CAMPO = {
  moeda: { casas: 2, label: '0,00' },
  taxa: { casas: 5, label: '0,00000' },
}

// Campos que já vêm numa ficha nova (mesmos do sistema da empresa).
export const CAMPOS_PADRAO = [
  { id: 'frete_peso', label: 'Frete Peso', tipo: 'moeda' },
  { id: 'pedagio', label: 'Pedágio', tipo: 'moeda' },
  { id: 'ad_valorem', label: 'Ad-Valorem', tipo: 'moeda' },
  { id: 'escolta', label: 'Escolta', tipo: 'moeda' },
  { id: 'adc_margem', label: 'Adc. Margem', tipo: 'moeda' },
  { id: 'ajudante', label: 'Ajudante', tipo: 'moeda' },
  { id: 'adc_imo', label: 'Adc. IMO', tipo: 'moeda' },
  { id: 'adc_ls', label: 'Adc. LS', tipo: 'moeda' },
  { id: 'outros', label: 'Outros', tipo: 'moeda' },
  { id: 'gris', label: 'Gris', tipo: 'moeda' },
]

export const RESP_SEGURO = [
  { value: 'transportadora', label: 'Transportadora' },
  { value: 'cliente', label: 'Cliente' },
]

export const novaFicha = () => ({
  cliente: '',
  campos: CAMPOS_PADRAO.map((c) => ({ ...c, valor: 0 })),
  respSeguro: 'transportadora',
  observacoes: '',
})

export const formatarValor = (valor, tipo = 'moeda') => {
  const casas = TIPOS_CAMPO[tipo]?.casas ?? 2
  return Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })
}

const fretesRef = collection(db, 'fretes')

export const criarFrete = (data, email) => {
  const agora = new Date().toISOString()
  return trackSave(addDoc(fretesRef, { ...data, createdAt: agora, updatedAt: agora, updatedBy: email }))
}

export const atualizarFrete = (id, data, email) =>
  trackSave(updateDoc(doc(db, 'fretes', id), { ...data, updatedAt: new Date().toISOString(), updatedBy: email }))

export const excluirFrete = (id) => deleteDoc(doc(db, 'fretes', id))
