import * as Popover from '@radix-ui/react-popover'
import { useState } from 'react'
import { ListChecks, LogOut, Moon, Sun } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function Avatar({ email, size = 'md' }) {
  const dim = size === 'sm' ? 'size-7 text-xs' : 'size-8 text-[13px]'
  return (
    <span className={`${dim} inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-slate-400 to-slate-500 font-semibold text-white`}>
      {(email || '?').charAt(0).toUpperCase()}
    </span>
  )
}

function Item({ icon: Icon, children, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-blue-500 hover:text-white ${danger ? 'text-red-500' : 'text-ink'}`}
    >
      <Icon className="size-4 opacity-80" strokeWidth={1.9} />
      {children}
    </button>
  )
}

// Menu da conta (estilo menu do macOS): cadastros, tema e sair.
// `trigger` é o elemento que abre o menu.
export default function AccountMenu({ trigger, isDark, onToggleTheme, onOpenRegistries, side = 'top', align = 'start' }) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const run = (fn) => () => {
    setOpen(false)
    fn()
  }
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side={side}
          align={align}
          sideOffset={8}
          collisionPadding={12}
          className="z-[70] w-64 rounded-xl bg-navy-800/95 p-1.5 shadow-lift ring-[0.5px] ring-black/10 backdrop-blur-xl data-[state=open]:animate-[pop-in_.14s_ease-out] dark:ring-white/10"
        >
          <div className="flex items-center gap-2.5 px-2.5 pb-2 pt-1.5">
            <Avatar email={user.email} />
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500">Conectado como</div>
              <div className="truncate text-[13px] font-medium text-ink">{user.email}</div>
            </div>
          </div>
          <div className="my-1 h-px bg-slate-700" />
          <Item icon={ListChecks} onClick={run(onOpenRegistries)}>Cadastros…</Item>
          <Item icon={isDark ? Sun : Moon} onClick={run(onToggleTheme)}>{isDark ? 'Modo claro' : 'Modo escuro'}</Item>
          <div className="my-1 h-px bg-slate-700" />
          <Item icon={LogOut} danger onClick={run(logout)}>Sair</Item>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
