// PREFERÊNCIAS DE TELA guardadas no navegador (modo da lista, seções da ficha
// recolhidas...). Nunca lançam: sem localStorage (janela privada, bloqueado,
// JSON quebrado) vale o padrão.
const armazemPadrao = () => {
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}

export const lerPreferencia = (chave, padrao, storage = armazemPadrao()) => {
  try {
    const bruto = storage?.getItem(chave)
    return bruto === null || bruto === undefined ? padrao : JSON.parse(bruto)
  } catch {
    return padrao
  }
}

export const gravarPreferencia = (chave, valor, storage = armazemPadrao()) => {
  try {
    storage?.setItem(chave, JSON.stringify(valor))
  } catch {
    /* sem storage: a preferência vale só até recarregar */
  }
}
