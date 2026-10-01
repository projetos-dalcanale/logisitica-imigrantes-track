import { useSyncExternalStore } from 'react'

// Estado global de salvamento ("Salvando…" / "Salvo"), alimentado por toda
// gravação de processo. O indicador no modal só lê daqui.
let state = { pending: 0, lastSavedAt: 0, error: false }
const listeners = new Set()
const emit = (patch) => {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

export const trackSave = async (promise) => {
  emit({ pending: state.pending + 1, error: false })
  try {
    const result = await promise
    emit({ pending: state.pending - 1, lastSavedAt: Date.now() })
    return result
  } catch (err) {
    emit({ pending: state.pending - 1, error: true })
    throw err
  }
}

export const useSaveStatus = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state
  )
