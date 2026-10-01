import { Truck } from 'lucide-react'

// Marca do app: ícone de caminhão num quadrado na cor da marca.
export default function Logo({ size = 'md' }) {
  const box = size === 'lg' ? 'size-12 rounded-2xl' : 'size-8 rounded-[10px]'
  const icon = size === 'lg' ? 'size-6' : 'size-[18px]'
  return (
    <div className={`${box} flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-900/25`}>
      <Truck className={icon} strokeWidth={2.25} />
    </div>
  )
}
