import { useAuth } from './contexts/AuthContext'
import LoginScreen from './components/LoginScreen'
import AppShell from './components/AppShell'
import { RegistriesProvider } from './contexts/RegistriesContext'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-slate-500">
        <i className="fas fa-spinner fa-spin text-xl" />
      </div>
    )
  }

  // Os cadastros compartilhados só podem ser lidos por quem está logado.
  return user ? (
    <RegistriesProvider>
      <AppShell />
    </RegistriesProvider>
  ) : (
    <LoginScreen />
  )
}
