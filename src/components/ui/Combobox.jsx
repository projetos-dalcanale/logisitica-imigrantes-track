import { useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Command } from 'cmdk'
import { Check, ChevronDown, ChevronsUpDown, Plus, Search, X } from 'lucide-react'

// Seleção com busca (Popover + cmdk). Dá pra criar um item novo direto do
// texto digitado (`onCreate`). Valores antigos fora da lista continuam
// aparecendo, marcados como "não cadastrado".
export default function Combobox({
  value = '',
  options,
  onChange,
  onCreate,
  placeholder = 'Selecione...',
  searchPlaceholder = 'Buscar...',
  createLabel = 'Adicionar',
  disabled,
  size = 'md',
  allowClear = true,
  variant = 'field',
}) {
  const plain = variant === 'plain'
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const term = search.trim()
  const exists = options.some((o) => o.toLowerCase() === term.toLowerCase())
  const foraDaLista = value && !options.includes(value)

  const pick = (v) => {
    onChange(v)
    setOpen(false)
    setSearch('')
  }

  const create = async () => {
    const novo = await onCreate(term)
    if (novo) pick(novo)
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setSearch('')
      }}
    >
      <Popover.Trigger asChild disabled={disabled}>
        <button
          type="button"
          className={plain ? 'field-plain flex items-center justify-end gap-1.5 text-right' : `field ${size === 'sm' ? 'field-sm' : ''} flex items-center justify-between gap-2 text-left`}
        >
          <span className={`truncate ${plain ? (value ? 'text-slate-400' : 'text-slate-500') : value ? 'text-ink' : 'text-slate-500'}`}>
            {value || placeholder}
            {foraDaLista && <span className="ml-1.5 text-[11px] text-yellow-500">(não cadastrado)</span>}
          </span>
          {plain ? (
            <ChevronsUpDown className="size-3.5 shrink-0 text-slate-500" />
          ) : (
            <ChevronDown className={`size-4 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align={plain ? 'end' : 'start'}
          sideOffset={6}
          collisionPadding={12}
          className="z-[70] w-[var(--radix-popover-trigger-width)] min-w-[240px] overflow-hidden rounded-xl bg-navy-800 shadow-lift ring-[0.5px] ring-black/5 dark:ring-white/10 data-[state=open]:animate-[pop-in_.14s_ease-out]"
        >
          <Command loop>
            <div className="flex items-center gap-2 border-b border-slate-700/70 px-3">
              <Search className="size-4 text-slate-500" />
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder={searchPlaceholder}
                className="h-10 w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate-500"
              />
            </div>
            <Command.List className="max-h-64 overflow-y-auto p-1 custom-scrollbar">
              <Command.Empty className="px-3 py-3 text-sm text-slate-500">
                {onCreate && term ? '' : 'Nenhum resultado.'}
              </Command.Empty>
              {allowClear && value && (
                <Command.Item value="__limpar__" onSelect={() => pick('')} className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500">
                  <X className="size-4" /> Limpar seleção
                </Command.Item>
              )}
              {options.map((opt) => (
                <Command.Item
                  key={opt}
                  value={opt}
                  onSelect={() => pick(opt)}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-ink"
                >
                  <span className="truncate">{opt}</span>
                  {opt === value && <Check className="size-4 shrink-0 text-blue-500" strokeWidth={2.5} />}
                </Command.Item>
              ))}
              {onCreate && term && !exists && (
                <Command.Item
                  value={`__criar__ ${term}`}
                  onSelect={create}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-blue-500"
                >
                  <Plus className="size-4" strokeWidth={2.5} /> {createLabel} “{term}”
                </Command.Item>
              )}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
