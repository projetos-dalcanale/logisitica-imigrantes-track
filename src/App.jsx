import { useCallback, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { useAuth } from './contexts/AuthContext'
import LoginScreen from './components/LoginScreen'
import LoginIntro from './components/LoginIntro'
import AppShell from './components/AppShell'
import Splash from './components/Splash'
import { RegistriesProvider } from './contexts/RegistriesContext'

export default function App() {
  const { user, loading } = useAuth()
  const reduzirMovimento = useReducedMotion() ?? false
  // A animação do logo só roda quando a pessoa acabou de passar pela tela de
  // login, não quando a sessão já existia (recarregar a página, por exemplo).
  const [viuLogin, setViuLogin] = useState(false)
  const [intro, setIntro] = useState(false)
  const fimIntro = useCallback(() => setIntro(false), [])
  if (!loading && !user && !viuLogin) setViuLogin(true)
  if (user && viuLogin) {
    setViuLogin(false)
    if (!reduzirMovimento) setIntro(true)
  }

  if (loading) return <Splash />

  // Os cadastros compartilhados só podem ser lidos por quem está logado.
  return user ? (
    <RegistriesProvider>
      <AppShell />
      {intro && <LoginIntro onFim={fimIntro} />}
    </RegistriesProvider>
  ) : (
    <LoginScreen />
  )
}
