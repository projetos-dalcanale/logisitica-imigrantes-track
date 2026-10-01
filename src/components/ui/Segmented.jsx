import { motion } from 'motion/react'
import { useId } from 'react'

// Controle segmentado (estilo iOS/macOS): a "pílula" desliza até a opção ativa.
// options: [{ value, label, icon? }]
export default function Segmented({ options, value, onChange, size = 'md', className = '', disabled }) {
  const id = useId()
  const pad = size === 'sm' ? 'h-8 text-[13px] px-3' : 'h-9 text-sm px-3.5'
  return (
    <div role="tablist" className={`flex gap-0.5 rounded-xl bg-navy-700/60 p-[3px] ${className}`}>
      {options.map((opt) => {
        const active = opt.value === value
        const Icon = opt.icon
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`relative flex-1 inline-flex items-center justify-center gap-1.5 rounded-[9px] font-semibold transition-colors disabled:opacity-60 ${pad} ${active ? 'text-ink' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-[9px] bg-navy-800 shadow-[0_1px_3px_rgb(0_0_0/0.12),0_1px_1px_rgb(0_0_0/0.04)]"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {Icon && <Icon className="size-4" strokeWidth={2.25} />}
              {opt.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
