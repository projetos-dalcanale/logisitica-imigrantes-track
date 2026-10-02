import { motion } from 'motion/react'
import { ChevronsUpDown, Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import AccountMenu, { Avatar } from './AccountMenu'
import Logo from './Logo'

function NavItem({ tab, active, count, onClick, shortcut }) {
  const Icon = tab.icon
  return (
    <button
      type="button"
      onClick={onClick}
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
export default function Sidebar({ sections, active, counts, onChange, onSearch, isDark, onToggleTheme, onOpenRegistries }) {
  const { user } = useAuth()
  const atalho = Object.fromEntries(sections.flatMap((s) => s.tabs).map((t, i) => [t.value, i + 1]))
  return (
    <aside className="material hairline-r hidden w-[248px] shrink-0 flex-col lg:flex">
      <div className="flex h-14 items-center gap-2.5 px-4">
        <Logo />
        <div className="leading-tight">
          <div className="text-[14px] font-semibold tracking-tight text-ink">LogiTrack</div>
          <div className="text-[11px] text-slate-500">Transportes Imigrantes</div>
        </div>
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
        {sections.map((section) => (
          <div key={section.title}>
            <div className="mb-1 px-2.5 text-[11px] font-semibold text-slate-500">{section.title}</div>
            <div className="space-y-0.5">
              {section.tabs.map((tab) => (
                <NavItem key={tab.value} tab={tab} shortcut={atalho[tab.value]} active={tab.value === active} count={counts[tab.value]} onClick={() => onChange(tab.value)} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3">
        <AccountMenu
          isDark={isDark}
          onToggleTheme={onToggleTheme}
          onOpenRegistries={onOpenRegistries}
          trigger={
            <button type="button" className="flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-slate-500/10">
              <Avatar email={user.email} size="sm" />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">{user.email.split('@')[0]}</span>
              <ChevronsUpDown className="size-3.5 text-slate-500" />
            </button>
          }
        />
      </div>
    </aside>
  )
}
