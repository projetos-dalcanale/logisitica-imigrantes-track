import { createContext, useContext, useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useDialog } from './DialogContext'

// CADASTROS COMPARTILHADOS com toda a equipe: cada categoria é um campo
// (lista de nomes) num documento da coleção "config" — os mesmos do app original.
export const REGISTRY_CONFIG = {
  cheio:   { label: 'Terminal de Carregamento', docId: 'terminals', field: 'cheio', novo: 'terminal', placeholder: 'Ex: Santos Brasil' },
  vazio:   { label: 'Terminal de Vazio',        docId: 'terminals', field: 'vazio', novo: 'terminal', placeholder: 'Ex: Depot Cubatão' },
  armador: { label: 'Armador',                  docId: 'armadores', field: 'lista', novo: 'armador',  placeholder: 'Ex: MSC' },
  tipo:    { label: 'Tipo de Contêiner',        docId: 'tipos',     field: 'lista', novo: 'tipo',     placeholder: "Ex: 40'HC" },
}

const sortPt = (lista) => [...lista].sort((a, b) => a.localeCompare(b, 'pt-BR'))

const RegistriesContext = createContext(null)

export function RegistriesProvider({ children }) {
  const { prompt } = useDialog()
  const [lists, setLists] = useState({ cheio: [], vazio: [], armador: [], tipo: [] })

  useEffect(() => {
    const unsubs = ['terminals', 'armadores', 'tipos'].map((docId) =>
      onSnapshot(doc(db, 'config', docId), (snap) => {
        const data = snap.exists() ? snap.data() : {}
        setLists((prev) => {
          const next = { ...prev }
          Object.entries(REGISTRY_CONFIG).forEach(([cat, cfg]) => {
            if (cfg.docId === docId) next[cat] = data[cfg.field] || []
          })
          return next
        })
      })
    )
    return () => unsubs.forEach((u) => u())
  }, [])

  const writeList = (cat, novaLista) => {
    const cfg = REGISTRY_CONFIG[cat]
    return setDoc(doc(db, 'config', cfg.docId), { [cfg.field]: novaLista }, { merge: true })
  }

  // Adiciona na lista (sem duplicar). Sem `nome`, pergunta numa janela.
  // Retorna o nome adicionado, ou null se cancelado.
  const adicionar = async (cat, nome) => {
    const cfg = REGISTRY_CONFIG[cat]
    const bruto = nome ?? (await prompt({ title: `Novo ${cfg.label.toLowerCase()}`, placeholder: cfg.placeholder, confirmLabel: 'Adicionar' }))
    if (!bruto || !bruto.trim()) return null
    const nomeLimpo = bruto.trim().slice(0, 150)
    if (!lists[cat].includes(nomeLimpo)) await writeList(cat, sortPt([...lists[cat], nomeLimpo]))
    return nomeLimpo
  }

  return (
    <RegistriesContext.Provider value={{ lists, adicionar, writeList, sortPt }}>
      {children}
    </RegistriesContext.Provider>
  )
}

export function useRegistries() {
  const ctx = useContext(RegistriesContext)
  if (!ctx) throw new Error('useRegistries precisa estar dentro de <RegistriesProvider>')
  return ctx
}
