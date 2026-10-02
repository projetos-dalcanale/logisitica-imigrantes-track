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
