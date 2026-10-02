// Lista agrupada no estilo dos Ajustes do iPhone: um título discreto acima,
// linhas dentro de um bloco arredondado e separadores finos entre elas.

export function Group({ title, footer, action, children, className = '' }) {
  return (
    <section className={className}>
      {(title || action) && (
        <div className="mb-1.5 flex min-h-6 items-end justify-between gap-3 px-4">
          {title && <h3 className="text-[13px] font-medium text-slate-400">{title}</h3>}
          {action}
        </div>
      )}
      <div className="overflow-hidden rounded-xl bg-navy-800 shadow-soft">
        <div className="divide-y divide-slate-700/80 [&>*]:border-slate-700/80">{children}</div>
      </div>
      {footer && <p className="mt-1.5 px-4 text-xs leading-relaxed text-slate-500">{footer}</p>}
    </section>
  )
}

// Linha da lista: rótulo à esquerda e conteúdo (valor ou campo) à direita.
// `stacked` coloca o conteúdo embaixo do rótulo (ex: campo de texto longo).
export function Row({ label, icon: Icon, children, stacked, htmlFor, className = '', onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`flex w-full min-h-11 gap-3 px-4 text-left text-[15px] ${stacked ? 'flex-col py-3' : 'items-center py-1.5'} ${onClick ? 'transition-colors hover:bg-navy-700/40 active:bg-navy-700/70' : ''} ${className}`}
    >
      {label && (
        <label htmlFor={htmlFor} className={`flex shrink-0 items-center gap-2.5 text-ink ${stacked ? 'text-[13px] font-medium text-slate-400' : ''}`}>
          {Icon && <Icon className="size-[18px] text-slate-400" strokeWidth={1.9} />}
          {label}
        </label>
      )}
      <div className={`min-w-0 ${stacked ? 'w-full' : 'flex flex-1 items-center justify-end gap-2 text-right'}`}>{children}</div>
    </Tag>
  )
}
