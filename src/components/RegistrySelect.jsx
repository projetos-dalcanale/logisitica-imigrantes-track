import { REGISTRY_CONFIG, useRegistries } from '../contexts/RegistriesContext'
import Combobox from './ui/Combobox'

// Seleção ligada a uma lista compartilhada (terminal, armador, tipo), com
// busca e criação de item novo direto do texto digitado.
export default function RegistrySelect({ cat, value = '', onChange, disabled, size }) {
  const { lists, adicionar } = useRegistries()
  const cfg = REGISTRY_CONFIG[cat]
  return (
    <Combobox
      value={value}
      options={lists[cat] || []}
      onChange={onChange}
      onCreate={(nome) => adicionar(cat, nome)}
      searchPlaceholder={`Buscar ${cfg.novo}...`}
      createLabel={`Adicionar ${cfg.novo}`}
      disabled={disabled}
      size={size}
    />
  )
}
