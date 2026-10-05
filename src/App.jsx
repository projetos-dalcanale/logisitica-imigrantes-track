import { useAuth } from './contexts/AuthContext'
import LoginScreen from './components/LoginScreen'
import AppShell from './components/AppShell'
import Splash from './components/Splash'
import { RegistriesProvider } from './contexts/RegistriesContext'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <Splash />

  // Os cadastros compartilhados só podem ser lidos por quem está logado.
  return user ? (
    <RegistriesProvider>
      <AppShell />
    </RegistriesProvider>
  ) : (
    <LoginScreen />
  )
}
