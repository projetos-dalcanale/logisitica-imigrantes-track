import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const inputClass =
  'w-full rounded-lg bg-navy-700 border border-slate-600 text-ink focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pl-9 pr-3 py-2.5 outline-none transition'

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
    <div className="fixed inset-0 bg-navy-900 flex items-center justify-center z-50 overflow-hidden px-4">
      <div className="pointer-events-none absolute -top-32 -left-24 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="relative bg-navy-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-700/80">
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-800/60 flex items-center justify-center mb-4">
            <i className="fas fa-truck-fast text-blue-400 text-lg" />
          </div>
          <h2 className="text-xl font-bold text-ink tracking-tight">LogiTrack</h2>
          <p className="text-[11px] text-slate-500 uppercase tracking-widest mt-1">Gestão Logística</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium text-slate-400 mb-1.5">E-mail</label>
            <div className="relative">
              <i className="fas fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
              <input id="auth-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label htmlFor="auth-password" className="block text-sm font-medium text-slate-400 mb-1.5">Senha</label>
            <div className="relative">
              <i className="fas fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
              <input id="auth-password" type="password" required minLength={6} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
            </div>
          </div>
          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-2.5 rounded-lg border border-red-800">{error}</div>
          )}
          <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-500 active:scale-[0.99] transition shadow-lg shadow-blue-900/50 disabled:opacity-70">
            {submitting ? <><i className="fas fa-spinner fa-spin" /> Entrando...</> : 'Entrar'}
          </button>
          <p className="text-xs text-slate-500 text-center pt-2 flex items-center justify-center gap-1.5">
            <i className="fas fa-shield-halved text-slate-500" />
            Acesso restrito a contas criadas pelo administrador.
          </p>
        </form>
      </div>
    </div>
  )
}
