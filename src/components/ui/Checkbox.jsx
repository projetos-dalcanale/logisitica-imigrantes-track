import { motion } from 'motion/react'

const TONES = {
  brand: 'bg-blue-500 border-blue-500',
  success: 'bg-emerald-500 border-emerald-500',
}

// Caixa de seleção própria, com o "check" sendo desenhado ao marcar.
export default function Checkbox({ id, checked, onChange, disabled, tone = 'brand', label, className = '' }) {
  return (
    <button
      id={id}
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
      className={`relative inline-flex size-[21px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors duration-150 disabled:opacity-50 ${checked ? TONES[tone] : 'border-slate-500/50 bg-transparent hover:border-slate-400'} ${className}`}
    >
      <svg viewBox="0 0 16 16" className="size-3.5 text-white" fill="none">
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
