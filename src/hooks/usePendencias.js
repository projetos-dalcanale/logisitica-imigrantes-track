import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../lib/banco'
import { DIAS_FEITAS } from '../lib/pendencias'

// Pendências de toda a equipe, em tempo real. Dois listeners, para a leitura do
// Firestore não crescer junto com o histórico: todas as não feitas (sem limite
// de data: as atrasadas antigas precisam continuar aparecendo) e só as feitas
// dos últimos DIAS_FEITAS dias. As duas consultas são de um campo só, então não
// precisam de índice composto (as não feitas têm feitoEm null e não entram na
// segunda).
export function usePendencias() {
  const [abertas, setAbertas] = useState(null) // null = ainda não respondeu
  const [feitas, setFeitas] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    const lista = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    const falhou = (err) => {
      // Mais comum: regras do Firestore ainda sem a coleção "pendencias".
      console.error('Erro ao carregar pendências:', err)
      setErro(err.code || 'erro')
      setAbertas((a) => a ?? [])
      setFeitas((f) => f ?? [])
    }
    const limite = new Date()
    limite.setDate(limite.getDate() - DIAS_FEITAS)
    const ref = collection(db, 'pendencias')
    const semFeitas = onSnapshot(query(ref, where('feito', '==', false)), (snap) => (setAbertas(lista(snap)), setErro(null)), falhou)
    const recentes = onSnapshot(query(ref, where('feitoEm', '>=', limite.toISOString())), (snap) => setFeitas(lista(snap)), falhou)
    return () => {
      semFeitas()
      recentes()
    }
  }, [])

  const loading = abertas === null || feitas === null
  // Junta os dois resultados (uma pendência é de um grupo só, mas por garantia sem repetir id).
  const pendencias = loading ? [] : [...new Map([...abertas, ...feitas].map((p) => [p.id, p])).values()]
  return { pendencias, loading, erro }
}
