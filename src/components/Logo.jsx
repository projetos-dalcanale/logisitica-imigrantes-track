import { useId } from 'react'

// Marca: pin de localização com o caminhão vazado (o fundo aparece por ele).
function PinCaminhao({ className }) {
  const mask = useId()
  return (
    <svg viewBox="4 2 16 21" className={className} aria-hidden="true">
      <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="#fff" />
        <rect x="6.5" y="6.9" width="6.5" height="4.7" rx="0.6" fill="#000" />
        <path d="M13.6 8.3h2.4l1.75 1.9v1.4h-4.15z" fill="#000" />
        <path d="M14.25 8.9h1.45l1 1.1h-2.45z" fill="#fff" />
        <circle cx="8.6" cy="12.15" r="1.6" fill="#fff" />
        <circle cx="15.6" cy="12.15" r="1.6" fill="#fff" />
        <circle cx="8.6" cy="12.15" r="0.9" fill="#000" />
        <circle cx="15.6" cy="12.15" r="0.9" fill="#000" />
      </mask>
      <path d="M12 22.4C12 22.4 4.4 15.2 4.4 9.6A7.6 7.6 0 0 1 19.6 9.6C19.6 15.2 12 22.4 12 22.4Z" fill="currentColor" mask={`url(#${mask})`} />
    </svg>
  )
}

// Ícone do app no formato de ícone de app da Apple (cantos contínuos,
// leve gradiente e brilho no topo), na cor de destaque escolhida.
export default function Logo({ size = 'md' }) {
  const box = size === 'lg' ? 'size-16 rounded-[18px]' : 'size-8 rounded-[9px]'
  const icon = size === 'lg' ? 'h-10' : 'h-5'
  return (
    <div
      className={`${box} relative flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-b from-blue-500 to-blue-300 text-white shadow-[0_1px_2px_rgb(0_0_0/0.2),inset_0_0.5px_0_rgb(255_255_255/0.35)] dark:to-blue-800`}
    >
      <PinCaminhao className={icon} />
    </div>
  )
}
