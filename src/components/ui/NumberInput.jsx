// Campo numérico no padrão de sistemas brasileiros: digita-se só números e a
// vírgula "anda" sozinha (1 → 0,01 → 0,12 → 1,23). `decimals` = casas decimais.
export default function NumberInput({ value = 0, onChange, decimals = 2, className = '', ...rest }) {
  const texto = Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  return (
    <input
      type="text"
      inputMode="numeric"
      value={texto}
      onChange={(e) => {
        const digitos = e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 15)
        onChange(digitos ? Number(digitos) / 10 ** decimals : 0)
      }}
      onFocus={(e) => e.target.select()}
      className={`field text-right tabular-nums ${className}`}
      {...rest}
    />
  )
}
