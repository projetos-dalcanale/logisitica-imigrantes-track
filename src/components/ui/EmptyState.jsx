import { motion } from 'motion/react'

// Ilustração simples de um contêiner (traços na cor da paleta), usada nos
// estados vazios. `variant="search"` adiciona uma lupa.
function ContainerArt({ search }) {
  return (
    <svg viewBox="0 0 160 110" className="h-24 w-auto" fill="none">
      <ellipse cx="80" cy="98" rx="58" ry="6" className="fill-slate-600/40" />
      <rect x="22" y="30" width="116" height="60" rx="6" className="fill-navy-800 stroke-slate-600" strokeWidth="2" />
      {[38, 52, 66, 80, 94, 108, 122].map((x) => (
        <line key={x} x1={x} y1="38" x2={x} y2="82" className="stroke-slate-600" strokeWidth="2" strokeLinecap="round" />
      ))}
      <rect x="22" y="30" width="116" height="10" rx="5" className="fill-blue-600/15 stroke-blue-600/40" strokeWidth="2" />
      {search && (
        <g>
          <circle cx="124" cy="34" r="16" className="fill-navy-800 stroke-blue-500" strokeWidth="3" />
          <line x1="135" y1="45" x2="146" y2="56" className="stroke-blue-500" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
    </svg>
  )
}

export default function EmptyState({ title, description, search, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center rounded-[20px] border border-dashed border-slate-600/70 bg-navy-800/50 px-6 py-14 text-center"
    >
      <ContainerArt search={search} />
      <h3 className="mt-5 text-[15px] font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  )
}
