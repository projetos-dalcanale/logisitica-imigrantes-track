import * as RadixTooltip from '@radix-ui/react-tooltip'

export const TooltipProvider = ({ children }) => (
  <RadixTooltip.Provider delayDuration={350} skipDelayDuration={150}>
    {children}
  </RadixTooltip.Provider>
)

// Dica ao passar o mouse (e no foco por teclado). `shortcut` mostra a tecla.
export default function Tooltip({ label, shortcut, side = 'bottom', children }) {
  if (!label) return children
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          className="z-[80] flex items-center gap-2 rounded-lg bg-slate-200 px-2.5 py-1.5 text-xs font-medium text-navy-800 shadow-lg"
        >
          {label}
          {shortcut && <span className="rounded bg-navy-800/20 px-1.5 py-0.5 text-[10px] font-semibold">{shortcut}</span>}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  )
}

// Botão só com ícone + dica. `icon` é um componente do lucide-react.
export function IconButton({ icon: Icon, label, shortcut, className = '', size = 'md', ...rest }) {
  const dim = size === 'sm' ? 'size-8' : 'size-9'
  return (
    <Tooltip label={label} shortcut={shortcut}>
      <button
        type="button"
        aria-label={label}
        className={`${dim} shrink-0 inline-flex items-center justify-center rounded-[10px] text-slate-400 hover:text-ink hover:bg-navy-700/70 transition-colors active:scale-95 ${className}`}
        {...rest}
      >
        <Icon className={size === 'sm' ? 'size-4' : 'size-[18px]'} strokeWidth={2} />
      </button>
    </Tooltip>
  )
}
