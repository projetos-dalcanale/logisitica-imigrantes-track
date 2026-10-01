import { useState } from 'react'

// MODO ESCURO (opcional, fica salvo no navegador de cada pessoa). O tema
// inicial já é aplicado por um script no index.html, antes do React carregar.
export function useTheme() {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark'
  )

  const toggleTheme = () => {
    const next = !isDark
    if (next) document.documentElement.setAttribute('data-theme', 'dark')
    else document.documentElement.removeAttribute('data-theme')
    try {
      localStorage.setItem('logitrack-theme', next ? 'dark' : 'light')
    } catch { /* navegador sem localStorage */ }
    setIsDark(next)
  }

  return { isDark, toggleTheme }
}
