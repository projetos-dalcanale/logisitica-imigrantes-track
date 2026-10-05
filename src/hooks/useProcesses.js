import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'

// Escuta os processos do usuário com um status, em tempo real.
function useStatus(uid, status, ativo) {
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid || !ativo) return
    const q = query(collection(db, 'processes'), where('userId', '==', uid), where('status', '==', status))
    return onSnapshot(
      q,
      (snapshot) => {
        setLista(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error(`Erro ao carregar processos (${status}):`, err)
        setLoading(false)
      }
    )
  }, [uid, status, ativo])

  return { lista, loading }
}

// Processos do usuário logado, sincronizados em tempo real com o Firestore.
// (As regras do Firestore só deixam cada um ler os próprios processos.)
// Os ativos carregam na abertura; os arquivados só quando `comArquivo` fica
// true pela primeira vez (aba Arquivados ou busca rápida) e então continuam
// carregados, para a abertura não crescer conforme o arquivo aumenta.
export function useProcesses(uid, comArquivo = false) {
  const [arquivoPedido, setArquivoPedido] = useState(comArquivo)
  if (comArquivo && !arquivoPedido) setArquivoPedido(true)

  const ativos = useStatus(uid, 'active', true)
  const arquivados = useStatus(uid, 'archived', arquivoPedido)

  return {
    processes: arquivoPedido ? [...ativos.lista, ...arquivados.lista] : ativos.lista,
    loading: ativos.loading,
    loadingArquivo: !arquivoPedido || arquivados.loading,
  }
}
