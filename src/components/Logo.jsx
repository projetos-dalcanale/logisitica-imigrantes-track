import { Truck } from 'lucide-react'

// Ícone do app no formato de ícone de app da Apple (cantos contínuos,
// leve gradiente e brilho no topo), na cor da marca.
export default function Logo({ size = 'md' }) {
  const box = size === 'lg' ? 'size-16 rounded-[18px]' : 'size-8 rounded-[9px]'
  const icon = size === 'lg' ? 'size-8' : 'size-[17px]'
  return (
    <div
      className={`${box} relative flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-b from-[#e2232b] to-[#a80008] text-white shadow-[0_1px_2px_rgb(0_0_0/0.2),inset_0_0.5px_0_rgb(255_255_255/0.35)]`}
    >
      <Truck className={icon} strokeWidth={2.2} />
    </div>
  )
}
