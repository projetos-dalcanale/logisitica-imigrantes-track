// Números no padrão brasileiro (1.234,56), usados nos valores de frete.

export const formatarNumero = (valor, casas = 2) =>
  Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })

// Digitação no estilo dos sistemas brasileiros: só os dígitos contam e a
// vírgula "anda" sozinha ("12345" com 2 casas → 123,45).
export const digitosParaNumero = (texto, casas = 2) => {
  const digitos = String(texto ?? '').replace(/\D/g, '').replace(/^0+/, '').slice(0, 15)
  return digitos ? Number(digitos) / 10 ** casas : 0
}
