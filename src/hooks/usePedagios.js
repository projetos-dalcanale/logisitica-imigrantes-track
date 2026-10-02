import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'

// Rotas de pedágio de toda a equipe, em tempo real e em ordem alfabética.
export function usePedagios() {
  const [pedagios, setPedagios] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(
    () =>
      onSnapshot(
        collection(db, 'pedagios'),
        (snap) => {
          const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          lista.sort((a, b) => `${a.origem} ${a.destino}`.localeCompare(`${b.origem} ${b.destino}`, 'pt-BR'))
          setPedagios(lista)
          setErro(null)
          setLoading(false)
        },
        (err) => {
          // Mais comum: regras do Firestore ainda sem a coleção "pedagios".
          console.error('Erro ao carregar pedágios:', err)
          setErro(err.code || 'erro')
          setLoading(false)
        }
      ),
    []
  )

  return { pedagios, loading, erro }
}
