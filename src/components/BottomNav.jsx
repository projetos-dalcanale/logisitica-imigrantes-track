import { motion } from 'motion/react'
import { Plus } from 'lucide-react'

function NavButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col items-center justify-center gap-[3px] pt-1 text-[10.5px] font-medium transition-colors ${active ? 'text-blue-500' : 'text-slate-500'}`}
    >
      <span className="relative flex h-7 w-12 items-center justify-center">
        {/* Pílula que desliza até a aba ativa. */}
        {active && (
          <motion.span
            layoutId="bottomnav-ativa"
            className="absolute inset-0 rounded-full bg-blue-500/12"
            transition={{ type: 'spring', stiffness: 500, damping: 38 }}
          />
        )}
        <motion.span className="relative" animate={{ scale: active ? 1.06 : 1 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
          <Icon className="size-[22px]" strokeWidth={active ? 2.2 : 1.8} />
        </motion.span>
      </span>
      {label}
    </button>
  )
}

// Barra de abas do celular, no estilo do iOS: material translúcido, 4 abas
// e o botão "+" central (novo processo, ou novo frete na aba Fretes).
export default function BottomNav({ tabs, active, onChange, onNew }) {
  const tab = (t) => <NavButton key={t.value} icon={t.icon} label={t.short} active={t.value === active} onClick={() => onChange(t.value)} />
  return (
    <nav className="material hairline-t fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="flex h-[52px] items-stretch px-1">
        {tab(tabs[0])}
        {tab(tabs[1])}
        <div className="flex flex-1 items-center justify-center">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={onNew}
            aria-label={active === 'fretes' ? 'Novo frete' : active === 'pedagios' ? 'Nova rota' : 'Novo processo'}
            className="flex size-10 items-center justify-center rounded-full bg-blue-500 text-white shadow-[0_2px_8px_rgb(var(--blue-500)/0.35)]"
          >
            <Plus className="size-[22px]" strokeWidth={2.6} />
          </motion.button>
        </div>
        {tab(tabs[2])}
        {tab(tabs[3])}
        {tab(tabs[4])}
      </div>
    </nav>
  )
}
