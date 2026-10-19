import AppShell from './components/AppShell'
import { RegistriesProvider } from './contexts/RegistriesContext'

// Tudo que só existe depois do login (e que precisa do Firestore). O App
// carrega este arquivo sob demanda, para a tela de login abrir mais leve.
export default function AreaLogada() {
  return (
    <RegistriesProvider>
      <AppShell />
    </RegistriesProvider>
  )
}
