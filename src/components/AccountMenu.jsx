import * as Popover from '@radix-ui/react-popover'
import { useId, useState } from 'react'
import { Check, KeyRound, ListChecks, LogOut, Moon, Pencil, Sun } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useDialog } from '../contexts/DialogContext'
import { useToast } from '../contexts/ToastContext'
import { mensagemDeLogin } from '../lib/loginErros'
import { CORES } from '../lib/temas'
import Segmented from './ui/Segmented'

export function Avatar({ nome, size = 'md' }) {
  const dim = size === 'sm' ? 'size-7 text-xs' : 'size-8 text-[13px]'
  return (
    <span className={`${dim} inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-slate-400 to-slate-500 font-semibold text-white`}>
      {(nome || '?').charAt(0).toUpperCase()}
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

// Aparência: claro/escuro e cor de destaque. Trocar aqui não fecha o menu,
// pra pessoa ver o resultado na hora.
function Aparencia({ isDark, onToggleTheme, accent, onAccentChange }) {
  const rotulo = useId()
  return (
    <div className="px-2.5 pb-2 pt-1">
      <div className="pb-1.5 text-[11px] font-medium text-slate-500">Aparência</div>
      <Segmented
        size="sm"
        value={isDark ? 'escuro' : 'claro'}
        onChange={(v) => { if ((v === 'escuro') !== isDark) onToggleTheme() }}
        options={[
          { value: 'claro', label: 'Claro', icon: Sun },
          { value: 'escuro', label: 'Escuro', icon: Moon },
        ]}
      />
      <div className="pb-1.5 pt-2.5 text-[11px] font-medium text-slate-500" id={rotulo}>Cor de destaque</div>
      <div role="radiogroup" aria-labelledby={rotulo} className="flex gap-2.5 px-0.5">
        {CORES.map((c) => {
          const ativa = c.id === accent
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={ativa}
              aria-label={c.nome}
              title={c.nome}
              onClick={() => onAccentChange(c.id)}
              className={`flex size-6 items-center justify-center rounded-full text-white transition-transform hover:scale-110 ${ativa ? 'ring-2 ring-offset-2 ring-offset-navy-800' : ''}`}
              style={{ backgroundColor: isDark ? c.escuro : c.claro, '--tw-ring-color': isDark ? c.escuro : c.claro }}
            >
              {ativa && <Check className="size-3.5" strokeWidth={3} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Menu da conta (estilo menu do macOS): cadastros, aparência e sair.
// `trigger` é o elemento que abre o menu.
export default function AccountMenu({ trigger, isDark, onToggleTheme, accent, onAccentChange, onOpenRegistries, side = 'top', align = 'start' }) {
  const { user, logout, nome, nomeExibido, salvarNome, resetarSenha } = useAuth()
  const { confirm, prompt } = useDialog()
  const showToast = useToast()
  const [open, setOpen] = useState(false)
  const run = (fn) => () => {
    setOpen(false)
    fn()
  }
  const editarNome = async () => {
    const novo = await prompt({
      title: 'Seu nome',
      message: 'Aparece no menu e na barra lateral.',
      placeholder: 'Como você quer ser chamado',
      defaultValue: nome,
      maxLength: 40,
    })
    if (novo === null || novo === nome) return
    try {
      await salvarNome(novo)
      showToast('Nome atualizado')
    } catch {
      showToast('Não foi possível salvar o nome', 'error')
    }
  }
  // Mesmo caminho do "Esqueci minha senha": o Firebase manda um link para o
  // e-mail da conta, e a senha nova é criada por ele.
  const alterarSenha = async () => {
    const ok = await confirm({
      title: 'Alterar senha',
      message: `Vamos enviar um link para ${user.email}. Abra o e-mail e crie a senha nova por ele.`,
      confirmLabel: 'Enviar link',
    })
    if (!ok) return
    try {
      await resetarSenha(user.email)
      showToast('Link enviado. Confira seu e-mail')
    } catch (err) {
      showToast(mensagemDeLogin(err.code), 'error')
    }
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
            <Avatar nome={nomeExibido} />
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium text-ink">{nomeExibido}</div>
              <div className="truncate text-[11px] text-slate-500">{user.email}</div>
            </div>
          </div>
          <div className="my-1 h-px bg-slate-700" />
          <Item icon={Pencil} onClick={run(editarNome)}>Alterar nome…</Item>
          <Item icon={KeyRound} onClick={run(alterarSenha)}>Alterar senha…</Item>
          <Item icon={ListChecks} onClick={run(onOpenRegistries)}>Cadastros…</Item>
          <div className="my-1 h-px bg-slate-700" />
          <Aparencia isDark={isDark} onToggleTheme={onToggleTheme} accent={accent} onAccentChange={onAccentChange} />
          <div className="my-1 h-px bg-slate-700" />
          <Item icon={LogOut} danger onClick={run(logout)}>Sair</Item>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
