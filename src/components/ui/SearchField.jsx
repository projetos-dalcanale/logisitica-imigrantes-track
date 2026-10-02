import { Search, X } from 'lucide-react'

// Campo de busca no estilo do iOS/macOS: cápsula cinza com lupa e botão de
// limpar. Esc limpa e sai do campo. `hint` mostra a tecla de atalho.
export default function SearchField({ value, onChange, placeholder = 'Buscar', hint, inputRef, title, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" strokeWidth={2.2} />
      <input
        ref={inputRef}
        type="search"
        value={value}
        title={title}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && (onChange(''), e.currentTarget.blur())}
        placeholder={placeholder}
        className="h-9 w-full rounded-[10px] bg-slate-500/12 pl-8 pr-9 text-[15px] text-ink outline-none transition-[background-color,box-shadow] placeholder:text-slate-500 focus:bg-navy-800 focus:shadow-[0_0_0_3.5px_rgb(var(--blue-500)/0.18)] [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Limpar busca"
          className="absolute right-2 top-1/2 flex size-[18px] -translate-y-1/2 items-center justify-center rounded-full bg-slate-500/60 text-white hover:bg-slate-500"
        >
          <X className="size-3" strokeWidth={3} />
        </button>
      ) : (
        hint && <span className="kbd pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 sm:inline-flex">{hint}</span>
      )}
    </div>
  )
}
