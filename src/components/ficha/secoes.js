import { createContext, useContext, useState } from 'react'
import { gravarPreferencia, lerPreferencia } from '../../lib/preferencias'

// Seções abertas/recolhidas da ficha. O que a pessoa escolhe vale para a ficha
// aberta e vira o padrão das próximas (por tipo de seção: Observações,
// Transporte...), guardado no navegador.
const CHAVE = 'logitrack-ficha-secoes'

export const SecoesContext = createContext(null)

export function useSecoesEstado() {
  const [padroes] = useState(() => lerPreferencia(CHAVE, {}))
  const [escolhas, setEscolhas] = useState({})
  const estaAberta = (id, kind) => (id in escolhas ? escolhas[id] : padroes[kind] !== false)
  const definir = (id, kind, aberta) => {
    setEscolhas((e) => ({ ...e, [id]: aberta }))
    gravarPreferencia(CHAVE, { ...lerPreferencia(CHAVE, {}), [kind]: aberta })
  }
  return {
    estaAberta,
    alternar: (id, kind) => definir(id, kind, !estaAberta(id, kind)),
    abrir: (id, kind) => definir(id, kind, true),
  }
}

// { aberta, alternar } de uma seção; fora da ficha, fica sempre aberta.
export function useSecao(id, kind) {
  const ctx = useContext(SecoesContext)
  return ctx ? { aberta: ctx.estaAberta(id, kind), alternar: () => ctx.alternar(id, kind) } : { aberta: true, alternar: () => {} }
}
