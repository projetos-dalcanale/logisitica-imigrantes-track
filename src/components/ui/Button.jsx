import { LoaderCircle } from 'lucide-react'

const VARIANTS = {
  primary: 'bg-blue-500 text-white hover:bg-blue-400 shadow-[0_1px_2px_rgb(0_0_0/0.12),inset_0_0.5px_0_rgb(255_255_255/0.18)]',
  tinted: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/15',
  secondary: 'bg-navy-800 text-ink shadow-soft hover:bg-navy-700/60',
  gray: 'bg-navy-700/70 text-ink hover:bg-navy-700',
  ghost: 'text-slate-400 hover:text-ink hover:bg-navy-700/60',
  plain: 'text-blue-500 hover:text-blue-400',
  danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/15',
  dangerSolid: 'bg-red-500 text-white hover:opacity-90 shadow-sm',
  success: 'bg-emerald-500 text-white hover:opacity-90 shadow-sm',
}

const SIZES = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-9 px-3.5 text-sm gap-1.5 rounded-[10px]',
  lg: 'h-11 px-5 text-[15px] gap-2 rounded-xl',
}

// Botão padrão do app (variantes no estilo dos botões do iOS/macOS).
// `icon` é um componente do lucide-react.
export default function Button({ variant = 'primary', size = 'md', icon: Icon, loading, className = '', children, disabled, type = 'button', ...rest }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex select-none items-center justify-center font-medium whitespace-nowrap transition-[background-color,color,opacity,transform] duration-150 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" /> : Icon && <Icon className="size-4 shrink-0" strokeWidth={2.1} />}
      {children}
    </button>
  )
}
