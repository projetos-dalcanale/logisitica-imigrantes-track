import { useState } from 'react'
import { motion } from 'motion/react'
import { CircleAlert, Lock, Mail, ShieldCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Button from './ui/Button'
import Logo from './Logo'

export default function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login(email, password)
      setError('')
    } catch (err) {
      const semAcesso = ['auth/user-not-found', 'auth/invalid-credential', 'auth/wrong-password']
      setError(
        semAcesso.includes(err.code)
          ? 'E-mail ou senha incorretos, ou esta conta ainda não foi cadastrada pelo administrador.'
          : 'Erro no login: ' + err.message
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-navy-900 px-4">
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="auth-email" className="label">E-mail</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <input id="auth-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field pl-9" />
            </div>
          </div>
          <div>
            <label htmlFor="auth-password" className="label">Senha</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <input id="auth-password" type="password" required minLength={6} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="field pl-9" />
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
          <Button type="submit" size="lg" loading={submitting} className="w-full">
            {submitting ? 'Entrando...' : 'Entrar'}
          </Button>
          <p className="flex items-center justify-center gap-1.5 pt-1 text-xs text-slate-500">
            <ShieldCheck className="size-3.5" />
            Acesso restrito a contas criadas pelo administrador.
          </p>
        </form>
      </motion.div>
    </div>
  )
}
