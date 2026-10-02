import * as RadixTooltip from '@radix-ui/react-tooltip'

export const TooltipProvider = ({ children }) => (
  <RadixTooltip.Provider delayDuration={500} skipDelayDuration={150}>
    {children}
  </RadixTooltip.Provider>
)

// Dica ao passar o mouse (e no foco por teclado), no estilo do macOS.
// `shortcut` mostra a tecla de atalho.
export default function Tooltip({ label, shortcut, side = 'bottom', children }) {
  if (!label) return children
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          collisionPadding={8}
          className="z-[80] flex max-w-72 items-center gap-2 rounded-md bg-navy-800/95 px-2 py-1 text-xs text-ink shadow-lift ring-[0.5px] ring-black/10 backdrop-blur-xl dark:ring-white/15"
        >
          {label}
          {shortcut && <span className="text-slate-500">{shortcut}</span>}
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
        className={`${dim} inline-flex shrink-0 items-center justify-center rounded-full text-blue-500 transition-[background-color,transform] hover:bg-slate-500/10 active:scale-95 ${className}`}
        {...rest}
      >
        <Icon className={size === 'sm' ? 'size-4' : 'size-[19px]'} strokeWidth={2} />
      </button>
    </Tooltip>
  )
}
