import Secao from '../ui/Secao'
import { useSecao } from './secoes'

// Seção da ficha: o estado aberta/recolhida vem do contexto da ficha.
export default function SecaoFicha({ id, kind, ...resto }) {
  const { aberta, alternar } = useSecao(id, kind)
  return <Secao id={id} aberta={aberta} onAlternar={alternar} {...resto} />
}
