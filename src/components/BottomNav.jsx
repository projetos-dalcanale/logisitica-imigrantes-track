import { motion } from 'motion/react'
import { Plus } from 'lucide-react'

function NavButton({ icon: Icon, label, active, badge, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 text-[11px] font-semibold transition-colors ${active ? 'text-blue-500' : 'text-slate-500'}`}
    >
      {active && (
        <motion.span layoutId="bottomnav-pill" className="absolute top-0 h-[3px] w-8 rounded-full bg-blue-500" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />
      )}
      <span className="relative">
        <Icon className="size-[22px]" strokeWidth={active ? 2.25 : 1.9} />
        {badge > 0 && (
          <span className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-navy-800 px-1 text-[10px] leading-4 tabular-nums text-slate-400 ring-1 ring-slate-600">
            {badge}
          </span>
        )}
      </span>
      {label}
    </button>
  )
}

// Navegação inferior no celular, como num app: 4 abas e botão central "+"
// (novo processo, ou novo frete quando a aba Fretes está aberta).
export default function BottomNav({ tabs, counts, active, onChange, onNew }) {
  const tab = (t) => (
    <NavButton key={t.value} icon={t.icon} label={t.short} active={t.value === active} badge={t.value === 'fretes' ? 0 : counts[t.value]} onClick={() => onChange(t.value)} />
  )
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-700/70 bg-navy-800/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden">
      <div className="flex h-16 items-stretch px-1">
        {tab(tabs[0])}
        {tab(tabs[1])}
        <div className="flex flex-1 items-center justify-center">
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={onNew}
            aria-label={active === 'fretes' ? 'Novo frete' : 'Novo processo'}
            className="-mt-6 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-900/30 ring-4 ring-navy-900"
          >
            <Plus className="size-6" strokeWidth={2.5} />
          </motion.button>
        </div>
        {tab(tabs[2])}
        {tab(tabs[3])}
      </div>
    </nav>
  )
}
