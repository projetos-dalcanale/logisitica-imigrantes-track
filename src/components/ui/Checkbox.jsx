import { motion } from 'motion/react'

const TONES = {
  brand: 'bg-blue-600 border-blue-600',
  success: 'bg-emerald-600 border-emerald-600',
}

// Caixa de seleção própria, com o "check" sendo desenhado ao marcar.
export default function Checkbox({ checked, onChange, disabled, tone = 'brand', label, className = '' }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
      className={`relative inline-flex size-[18px] shrink-0 items-center justify-center rounded-[6px] border-[1.5px] transition-colors duration-150 disabled:opacity-50 ${checked ? TONES[tone] : 'border-slate-500/60 bg-navy-800 hover:border-slate-400'} ${className}`}
    >
      <svg viewBox="0 0 16 16" className="size-3 text-white" fill="none">
        <motion.path
          d="M3.5 8.5l3 3 6-7"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        />
      </svg>
    </button>
  )
}
