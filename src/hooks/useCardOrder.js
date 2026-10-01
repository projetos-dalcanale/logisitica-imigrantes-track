import { useState } from 'react'

const KEY = 'logitrack-card-order'

const read = () => {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

// ORDEM PERSONALIZADA DOS CARDS (arrastar para reordenar). Fica salva só
// neste navegador — preferência pessoal, não compartilhada com a equipe.
// Usa a mesma chave do app original, então a ordem já salva é mantida.
export function useCardOrder() {
  const [order, setOrder] = useState(read)

  // Aplica a ordem salva; quem não tem posição vai pro fim, mantendo a ordem recebida.
  const applyOrder = (items) => {
    if (!order.length) return items
    const indice = new Map(order.map((id, i) => [id, i]))
    return [...items].sort((a, b) => (indice.get(a.id) ?? Infinity) - (indice.get(b.id) ?? Infinity))
  }

  // Salva a nova ordem dos ids visíveis; ids de outras abas ficam no fim.
  const saveOrder = (idsNaTela) => {
    const next = [...idsNaTela, ...order.filter((id) => !idsNaTela.includes(id))]
    setOrder(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch { /* navegador sem localStorage */ }
  }

  return { applyOrder, saveOrder }
}
