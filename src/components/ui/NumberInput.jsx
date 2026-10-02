import { digitosParaNumero, formatarNumero } from '../../lib/numeros'

// Campo numérico no padrão de sistemas brasileiros: digita-se só números e a
// vírgula "anda" sozinha (1 → 0,01 → 0,12 → 1,23). `decimals` = casas decimais.
export default function NumberInput({ value = 0, onChange, decimals = 2, plain = false, className = '', ...rest }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={formatarNumero(value, decimals)}
      onChange={(e) => onChange(digitosParaNumero(e.target.value, decimals))}
      onFocus={(e) => e.target.select()}
      className={`${plain ? 'field-plain' : 'field'} text-right tabular-nums ${className}`}
      {...rest}
    />
  )
}
