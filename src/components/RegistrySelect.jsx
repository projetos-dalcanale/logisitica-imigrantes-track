import { REGISTRY_CONFIG, useRegistries } from '../contexts/RegistriesContext'

// Select ligado a uma lista compartilhada (terminal, armador, tipo), com a
// opção "+ Adicionar novo..." no fim. Valores antigos que não estão mais na
// lista continuam aparecendo, marcados como "(não cadastrado)".
export default function RegistrySelect({ cat, value = '', onChange, ...rest }) {
  const { lists, adicionar } = useRegistries()
  const lista = lists[cat] || []

  const handleChange = async (e) => {
    if (e.target.value === '__novo__') {
      const novo = await adicionar(cat)
      if (novo) onChange(novo)
    } else {
      onChange(e.target.value)
    }
  }

  return (
    <select value={value} onChange={handleChange} {...rest}>
      <option value="">Selecione...</option>
      {lista.map((nome) => (
        <option key={nome} value={nome}>{nome}</option>
      ))}
      {value && !lista.includes(value) && <option value={value}>{value} (não cadastrado)</option>}
      <option value="__novo__">+ Adicionar novo {REGISTRY_CONFIG[cat].novo}...</option>
    </select>
  )
}
