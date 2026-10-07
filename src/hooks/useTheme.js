import { useEffect, useState } from 'react'
import { CHAVE_COR, aplicarCor, corDaBarra, normalizarCor } from '../lib/temas'

// MODO ESCURO e COR DE DESTAQUE (opcionais, ficam salvos no navegador de cada
// pessoa). O tema inicial já é aplicado por um script no index.html, antes do
// React carregar.
export function useTheme() {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark'
  )
  const [accent, setAccentState] = useState(
    () => normalizarCor(document.documentElement.getAttribute('data-accent'))
  )

  // Barra do navegador no celular acompanha a cor escolhida.
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', corDaBarra(accent))
  }, [accent])

  // Transição de cor só durante a troca, pra não deixar o resto do app "lento".
  const comTransicao = (aplicar) => {
    const root = document.documentElement
    root.classList.add('theme-transition')
    aplicar(root)
    setTimeout(() => root.classList.remove('theme-transition'), 350)
  }

  const toggleTheme = () => {
    const next = !isDark
    comTransicao((root) => {
      if (next) root.setAttribute('data-theme', 'dark')
      else root.removeAttribute('data-theme')
    })
    try {
      localStorage.setItem('logitrack-theme', next ? 'dark' : 'light')
    } catch { /* navegador sem localStorage */ }
    setIsDark(next)
  }

  const setAccent = (valor) => {
    let cor
    comTransicao((root) => { cor = aplicarCor(root, valor) })
    try {
      localStorage.setItem(CHAVE_COR, cor)
    } catch { /* navegador sem localStorage */ }
    setAccentState(cor)
  }

  return { isDark, toggleTheme, accent, setAccent }
}
