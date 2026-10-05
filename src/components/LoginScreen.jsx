import { useState } from 'react'
import { motion } from 'motion/react'
import { CircleAlert, Lock, Mail, MailCheck, ShieldCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { mensagemDeLogin } from '../lib/loginErros'
import Button from './ui/Button'
import Logo from './Logo'
import LoginArt from './LoginArt'

export default function LoginScreen() {
  const { login, resetarSenha } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [enviandoLink, setEnviandoLink] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setAviso('')
    try {
      await login(email, password)
      setError('')
    } catch (err) {
      setError(mensagemDeLogin(err.code))
    } finally {
      setSubmitting(false)
    }
  }

  const esqueciSenha = async () => {
    setAviso('')
    if (!email.trim()) {
      setError('Digite seu e-mail acima para receber o link de nova senha.')
      document.getElementById('auth-email')?.focus()
      return
    }
    setEnviandoLink(true)
    try {
      await resetarSenha(email.trim())
      setError('')
      // Texto neutro de propósito: não revela se o e-mail tem conta ou não.
      setAviso(`Se ${email.trim()} tiver uma conta, enviamos um link para criar uma nova senha. Confira também o spam.`)
    } catch (err) {
      setError(mensagemDeLogin(err.code))
    } finally {
      setEnviandoLink(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-navy-900 px-4 py-10">
      <LoginArt />
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="relative w-full max-w-[360px]"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="lg" />
          <h1 className="mt-5 font-display text-[28px] font-bold tracking-[-0.025em] text-ink">LogiTrack</h1>
          <p className="mt-1 text-[15px] text-slate-400">Entre com sua conta da Transportes Imigrantes</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4 p-5 shadow-lift sm:p-6">
          <div>
            <label htmlFor="auth-email" className="label">E-mail</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <input id="auth-email" name="email" type="email" required autoComplete="email" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} className="field pl-9" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <label htmlFor="auth-password" className="label">Senha</label>
              <button
                type="button"
                onClick={esqueciSenha}
                disabled={enviandoLink}
                className="text-[12.5px] font-medium text-blue-500 transition-opacity hover:underline disabled:opacity-50"
              >
                {enviandoLink ? 'Enviando…' : 'Esqueci minha senha'}
              </button>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <input id="auth-password" name="password" type="password" required minLength={6} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="field pl-9" />
            </div>
          </div>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-400"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              {error}
            </motion.div>
          )}
          {aviso && (
            <motion.div
              role="status"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-500"
            >
              <MailCheck className="mt-0.5 size-4 shrink-0" />
              {aviso}
            </motion.div>
          )}
          <Button type="submit" size="lg" loading={submitting} className="w-full">
            {submitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
        <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="size-3.5" />
          Acesso restrito a contas criadas pelo administrador.
        </p>
      </motion.div>
      <p className="absolute inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] text-center text-[11px] text-slate-500">
        LogiTrack Pro · Transportes Imigrantes
      </p>
    </div>
  )
}
