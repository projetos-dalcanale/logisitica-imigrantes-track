import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, ChevronsUpDown, House, Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import AccountMenu, { Avatar } from './AccountMenu'
import Logo from './Logo'

function NavItem({ tab, active, count, onClick, shortcut }) {
  const Icon = tab.icon
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      title={`${tab.label} (${shortcut})`}
      className={`relative flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13.5px] transition-colors ${active ? 'text-ink' : 'text-slate-300 hover:bg-slate-500/10'}`}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-lg bg-slate-500/15 dark:bg-white/10"
          transition={{ type: 'spring', stiffness: 520, damping: 40 }}
        />
      )}
      <Icon className={`relative size-[17px] ${active ? 'text-blue-500' : 'text-slate-400'}`} strokeWidth={2} />
      <span className={`relative flex-1 ${active ? 'font-semibold' : 'font-medium'}`}>{tab.label}</span>
      {count > 0 && <span className="relative text-xs tabular-nums text-slate-500">{count}</span>}
    </button>
  )
}

// Barra lateral no estilo do macOS: material translúcido, navegação por
// seções, busca e conta no rodapé. Só aparece no desktop.
export default function Sidebar({ sections, active, counts, onChange, onHome, onSearch, isDark, onToggleTheme, onOpenRegistries }) {
  const { nomeExibido } = useAuth()
  const [fechadas, setFechadas] = useState({})
  const alternar = (titulo) => setFechadas((f) => ({ ...f, [titulo]: !f[titulo] }))
  const atalho = Object.fromEntries(sections.flatMap((s) => s.tabs).map((t, i) => [t.value, i + 1]))
  return (
    <aside className="material hairline-r hidden w-[248px] shrink-0 flex-col lg:flex">
      <div className="flex h-14 items-center gap-2.5 px-4">
        <Logo />
        <div className="leading-tight">
          <div className="text-[14px] font-semibold tracking-tight text-ink">LogiTrack</div>
          <div className="text-[11px] text-slate-500">Transportes Imigrantes</div>
        </div>
        <button
          type="button"
          onClick={onHome}
          aria-label="Início"
          aria-current={active === 'inicio' ? 'page' : undefined}
          title="Início (H)"
          className={`ml-auto flex size-8 items-center justify-center rounded-lg transition-colors ${active === 'inicio' ? 'bg-slate-500/15 text-blue-500 dark:bg-white/10' : 'text-slate-400 hover:bg-slate-500/10 hover:text-ink'}`}
        >
          <House className="size-[18px]" strokeWidth={2.1} aria-hidden="true" />
        </button>
      </div>

      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={onSearch}
          className="flex h-8 w-full items-center gap-2 rounded-lg bg-slate-500/10 px-2.5 text-[13px] text-slate-500 transition-colors hover:bg-slate-500/15"
        >
          <Search className="size-3.5" strokeWidth={2.2} />
          <span className="flex-1 text-left">Buscar</span>
          <span className="text-[11px] tracking-wide">Ctrl K</span>
        </button>
      </div>

      <nav className="custom-scrollbar flex-1 space-y-5 overflow-y-auto px-3 pt-2">
        {sections.map((section) => {
          const aberta = !fechadas[section.title]
          return (
            <div key={section.title}>
              <button
                type="button"
                onClick={() => alternar(section.title)}
                aria-expanded={aberta}
                className="mb-1 flex w-full items-center gap-1 rounded-md px-2.5 py-1 text-left text-[13px] font-semibold text-slate-300 transition-colors hover:text-ink"
              >
                <span className="flex-1">{section.title}</span>
                <ChevronDown className={`size-4 text-slate-400 transition-transform duration-200 ${aberta ? '' : '-rotate-90'}`} strokeWidth={2.4} />
              </button>
              <AnimatePresence initial={false}>
                {aberta && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="space-y-0.5 overflow-hidden"
                  >
                    {section.tabs.map((tab) => (
                      <NavItem key={tab.value} tab={tab} shortcut={atalho[tab.value]} active={tab.value === active} count={counts[tab.value]} onClick={() => onChange(tab.value)} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </nav>

      <div className="p-3">
        <AccountMenu
          isDark={isDark}
          onToggleTheme={onToggleTheme}
          onOpenRegistries={onOpenRegistries}
          trigger={
            <button type="button" className="flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-slate-500/10">
              <Avatar nome={nomeExibido} size="sm" />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">{nomeExibido}</span>
              <ChevronsUpDown className="size-3.5 text-slate-500" />
            </button>
          }
        />
      </div>
    </aside>
  )
}
