import { LoaderCircle } from 'lucide-react'

const VARIANTS = {
  primary: 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-900/20',
  secondary: 'bg-navy-800 text-slate-300 border border-slate-600/80 hover:bg-navy-700 hover:text-ink',
  ghost: 'text-slate-400 hover:text-ink hover:bg-navy-700/70',
  danger: 'text-red-400 border border-red-400/30 hover:bg-red-400/10 hover:border-red-400/50',
  dangerSolid: 'bg-red-600 text-white hover:bg-red-500 shadow-sm',
  success: 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm',
}

const SIZES = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-[10px]',
  lg: 'h-11 px-5 text-[15px] gap-2 rounded-xl',
}

// Botão padrão do app. `icon` é um componente do lucide-react.
export default function Button({ variant = 'primary', size = 'md', icon: Icon, loading, className = '', children, disabled, ...rest }) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold whitespace-nowrap transition-[background-color,color,border-color,transform,box-shadow] duration-150 active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" /> : Icon && <Icon className="size-4 shrink-0" strokeWidth={2.25} />}
      {children}
    </button>
  )
}
