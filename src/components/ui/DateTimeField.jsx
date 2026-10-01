import { useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { DayPicker } from 'react-day-picker'
import { ptBR } from 'react-day-picker/locale'
import { CalendarDays, X } from 'lucide-react'

const pad = (n) => String(n).padStart(2, '0')

// Mesmo formato do <input type="datetime-local">: "2026-09-20T14:30".
const toValue = (date, time) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${time}`

const parse = (value) => {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

// "Sex, 02 out · 09:00"
const formatar = (d) => {
  const semana = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
  const mes = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  return `${semana.charAt(0).toUpperCase()}${semana.slice(1)}, ${pad(d.getDate())} ${mes} · ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Data + hora com calendário próprio. Só grava ao fechar (uma escrita por
// edição), com o valor no mesmo formato usado desde o app original.
export default function DateTimeField({ value = '', onChange, disabled, size = 'md', placeholder = 'Definir data e hora' }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const atual = parse(value)
  const draftDate = parse(draft)
  const time = draftDate ? `${pad(draftDate.getHours())}:${pad(draftDate.getMinutes())}` : '08:00'

  const onOpenChange = (o) => {
    if (o) setDraft(value)
    else if (draft !== value) onChange(draft)
    setOpen(o)
  }

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <div className="relative">
        <Popover.Trigger asChild disabled={disabled}>
          <button type="button" className={`field ${size === 'sm' ? 'field-sm' : ''} flex items-center gap-2 text-left pr-8`}>
            <CalendarDays className="size-4 shrink-0 text-slate-500" />
            <span className={`truncate tabular-nums ${atual ? 'text-ink' : 'text-slate-500'}`}>
              {atual ? formatar(atual) : placeholder}
            </span>
          </button>
        </Popover.Trigger>
        {atual && !disabled && (
          <button
            type="button"
            aria-label="Limpar data"
            onClick={() => onChange('')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 flex size-6 items-center justify-center rounded-md text-slate-500 hover:bg-navy-700 hover:text-ink"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-[70] rounded-2xl border border-slate-700/80 bg-navy-800 p-3 shadow-lift data-[state=open]:animate-[pop-in_.14s_ease-out]"
        >
          <DayPicker
            mode="single"
            locale={ptBR}
            selected={draftDate || undefined}
            defaultMonth={draftDate || undefined}
            onSelect={(d) => d && setDraft(toValue(d, time))}
          />
          <div className="mt-2 flex items-center gap-2 border-t border-slate-700/70 pt-3">
            <label className="text-xs font-semibold text-slate-500">Hora</label>
            <input
              type="time"
              value={time}
              onChange={(e) => e.target.value && setDraft(toValue(draftDate || new Date(), e.target.value))}
              className="field field-sm w-auto tabular-nums"
            />
            <button
              type="button"
              onClick={() => {
                const now = new Date()
                setDraft(toValue(now, `${pad(now.getHours())}:${pad(now.getMinutes())}`))
              }}
              className="ml-auto rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:bg-navy-700 hover:text-ink"
            >
              Agora
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
            >
              OK
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
