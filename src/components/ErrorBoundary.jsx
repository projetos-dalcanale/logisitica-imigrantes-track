import { Component } from 'react'
import { RotateCw, TriangleAlert } from 'lucide-react'
import { recarregarSeVersaoAntiga, registrarErro } from '../lib/erros'

// Se uma tela quebrar, mostra um aviso com "Recarregar" em vez de uma página
// em branco, e registra o erro para conserto.
export default class ErrorBoundary extends Component {
  state = { erro: null }

  static getDerivedStateFromError(erro) {
    return { erro }
  }

  componentDidCatch(erro, info) {
    if (!recarregarSeVersaoAntiga(erro)) registrarErro(erro, 'tela', { componentStack: info?.componentStack })
  }

  render() {
    if (!this.state.erro) return this.props.children
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-navy-900 px-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <TriangleAlert className="size-6" strokeWidth={2.2} />
        </span>
        <div>
          <h1 className="font-display text-[20px] font-bold text-ink">Algo deu errado</h1>
          <p className="mt-1 max-w-sm text-[14px] text-slate-400">Recarregue a página. Seus dados estão salvos no servidor.</p>
        </div>
        <button
          type="button"
          onClick={() => location.reload()}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-blue-500 px-5 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          <RotateCw className="size-4" strokeWidth={2.4} />
          Recarregar
        </button>
      </div>
    )
  }
}
