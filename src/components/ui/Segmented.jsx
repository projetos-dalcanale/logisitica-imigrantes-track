import { motion } from 'motion/react'
import { useId } from 'react'

// Controle segmentado (estilo iOS/macOS): a "pílula" desliza até a opção ativa.
// options: [{ value, label, icon? }]
export default function Segmented({ options, value, onChange, size = 'md', className = '', disabled }) {
  const id = useId()
  const pad = size === 'sm' ? 'h-7 text-[13px] px-2.5' : 'h-8 text-[13.5px] px-3'
  return (
    <div role="radiogroup" className={`flex rounded-[9px] bg-slate-500/12 p-[2px] ${className}`}>
      {options.map((opt) => {
        const active = opt.value === value
        const Icon = opt.icon
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`relative inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[7px] font-medium transition-colors disabled:opacity-60 ${pad} ${active ? 'text-ink' : 'text-slate-400 hover:text-ink'}`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-[7px] bg-white shadow-[0_3px_8px_rgb(0_0_0/0.12),0_3px_1px_rgb(0_0_0/0.04),0_0_0_0.5px_rgb(0_0_0/0.04)] dark:bg-[#636366]"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5 truncate">
              {Icon && <Icon className="size-[15px]" strokeWidth={2.2} />}
              {opt.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
