import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'

// Processos do usuário logado, sincronizados em tempo real com o Firestore.
// (As regras do Firestore só deixam cada um ler os próprios processos.)
export function useProcesses(uid) {
  const [processes, setProcesses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'processes'), where('userId', '==', uid))
    return onSnapshot(
      q,
      (snapshot) => {
        setProcesses(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error('Erro ao carregar processos:', err)
        setLoading(false)
      }
    )
  }, [uid])

  return { processes, loading }
}
