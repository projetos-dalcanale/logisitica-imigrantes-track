import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import { trackSave } from './saveStatus'
import { formatarNumero } from './numeros'

// TABELA DE FRETES POR CLIENTE (coleção "fretes", compartilhada com a equipe).
// Cada documento: { cliente, campos: [{ id, label, tipo, valor, custom? }],
// observacoes, createdAt, updatedAt, updatedBy }. Fichas antigas podem ter
// "respSeguro", que não é mais usado (o seguro é sempre da transportadora).

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

export const novaFicha = () => ({
  cliente: '',
  campos: CAMPOS_PADRAO.map((c) => ({ ...c, valor: 0 })),
  observacoes: '',
})

export const formatarValor = (valor, tipo = 'moeda') => formatarNumero(valor, TIPOS_CAMPO[tipo]?.casas ?? 2)

const fretesRef = collection(db, 'fretes')

export const criarFrete = (data, email) => {
  const agora = new Date().toISOString()
  return trackSave(addDoc(fretesRef, { ...data, createdAt: agora, updatedAt: agora, updatedBy: email }))
}

export const atualizarFrete = (id, data, email) =>
  trackSave(updateDoc(doc(db, 'fretes', id), { ...data, updatedAt: new Date().toISOString(), updatedBy: email }))

export const excluirFrete = (id) => deleteDoc(doc(db, 'fretes', id))
