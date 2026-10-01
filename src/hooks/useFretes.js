import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'

// Tabela de fretes de todos os clientes, em tempo real e em ordem alfabética.
export function useFretes() {
  const [fretes, setFretes] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(
    () =>
      onSnapshot(
        collection(db, 'fretes'),
        (snap) => {
          const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          lista.sort((a, b) => (a.cliente || '').localeCompare(b.cliente || '', 'pt-BR'))
          setFretes(lista)
          setErro(null)
          setLoading(false)
        },
        (err) => {
          // Mais comum: regras do Firestore ainda sem a coleção "fretes".
          console.error('Erro ao carregar fretes:', err)
          setErro(err.code || 'erro')
          setLoading(false)
        }
      ),
    []
  )

  return { fretes, loading, erro }
}
