import { useState } from 'react'

// MODO ESCURO (opcional, fica salvo no navegador de cada pessoa). O tema
// inicial já é aplicado por um script no index.html, antes do React carregar.
export function useTheme() {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark'
  )

  const toggleTheme = () => {
    const next = !isDark
    const root = document.documentElement
    // Transição de cor só durante a troca, pra não deixar o resto do app "lento".
    root.classList.add('theme-transition')
    if (next) root.setAttribute('data-theme', 'dark')
    else root.removeAttribute('data-theme')
    setTimeout(() => root.classList.remove('theme-transition'), 350)
    try {
      localStorage.setItem('logitrack-theme', next ? 'dark' : 'light')
    } catch { /* navegador sem localStorage */ }
    setIsDark(next)
  }

  return { isDark, toggleTheme }
}
