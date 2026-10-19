import { useSyncExternalStore } from 'react'

// true enquanto a media query casar (ex: '(max-width: 639px)').
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}

export const useIsPhone = () => useMediaQuery('(max-width: 639px)')

// Tela larga o bastante para mostrar o detalhe do processo num painel ao lado
// da lista (abaixo disso, continua abrindo em janela).
export const usePainelLateral = () => useMediaQuery('(min-width: 1400px)')
