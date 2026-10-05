import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth'
import { auth } from '../lib/firebase'

const AuthContext = createContext(null)

// SEGURANÇA: apenas login, sem auto-cadastro. Só entra quem já tem uma conta
// criada manualmente em Firebase Console > Authentication > Users.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // true até o Firebase dizer se há sessão salva, pra não piscar a tela de login
  const [loading, setLoading] = useState(true)
  // O Firebase muda o displayName no mesmo objeto `user`, então o React não
  // percebe. Por isso o nome fica num estado próprio, que força a re-renderização.
  const [nomeEditado, setNomeEditado] = useState(null)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setNomeEditado(null)
      setLoading(false)
    })
  }, [])

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password)
  const logout = () => signOut(auth)
  // Só funciona para contas que já existem: não abre caminho para auto-cadastro.
  const resetarSenha = (email) => sendPasswordResetEmail(auth, email)

  const salvarNome = async (nome) => {
    const limpo = nome.trim()
    await updateProfile(auth.currentUser, { displayName: limpo })
    setNomeEditado(limpo)
  }
  const nome = nomeEditado ?? user?.displayName ?? ''
  // Sem nome definido, cai no começo do e-mail, como era antes.
  const nomeExibido = nome || user?.email?.split('@')[0] || ''

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, resetarSenha, nome, nomeExibido, salvarNome }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
