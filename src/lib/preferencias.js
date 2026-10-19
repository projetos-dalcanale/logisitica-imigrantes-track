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

// Valor guardado só vale se for do mesmo tipo do padrão (objeto, texto...): um
// JSON válido mas de outro tipo ("null", uma lista) derrubaria quem lê.
const mesmoTipo = (valor, padrao) => {
  if (valor === null || padrao === null) return valor === padrao
  if (Array.isArray(valor) !== Array.isArray(padrao)) return false
  return typeof valor === typeof padrao
}

export const lerPreferencia = (chave, padrao, storage = armazemPadrao()) => {
  try {
    const bruto = storage?.getItem(chave)
    if (bruto === null || bruto === undefined) return padrao
    const valor = JSON.parse(bruto)
    return mesmoTipo(valor, padrao) ? valor : padrao
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
