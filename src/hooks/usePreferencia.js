import { useCallback, useState } from 'react'
import { gravarPreferencia, lerPreferencia } from '../lib/preferencias'

// Como useState, mas lembra o valor no navegador (ver lib/preferencias.js).
export function usePreferencia(chave, padrao) {
  const [valor, setValor] = useState(() => lerPreferencia(chave, padrao))
  const definir = useCallback(
    (novo) => {
      setValor((atual) => {
        const proximo = typeof novo === 'function' ? novo(atual) : novo
        gravarPreferencia(chave, proximo)
        return proximo
      })
    },
    [chave]
  )
  return [valor, definir]
}
