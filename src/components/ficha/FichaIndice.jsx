import { useContext, useEffect, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { SecoesContext } from './secoes'

// Índice da ficha: coluna lateral fixa quando a ficha é larga (container
// query @3xl) e barra de atalhos fixa no topo quando não é. Clicar abre a
// seção (se estiver recolhida) e rola até ela; a seção à vista fica marcada.
export default function FichaIndice({ secoes, scrollerRef }) {
  const ctx = useContext(SecoesContext)
  const reduzir = useReducedMotion()
  const [ativo, setAtivo] = useState(secoes[0]?.id)
  const chave = secoes.map((s) => s.id).join('|')

  useEffect(() => {
    const raiz = scrollerRef.current
    if (!raiz || typeof IntersectionObserver === 'undefined') return
    const visiveis = new Set()
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => (e.isIntersecting ? visiveis.add(e.target.dataset.secao) : visiveis.delete(e.target.dataset.secao)))
        const primeira = secoes.find((s) => visiveis.has(s.id))
        if (primeira) setAtivo(primeira.id)
      },
      { root: raiz, rootMargin: '-10% 0px -60% 0px' }
    )
    secoes.forEach((s) => {
      const el = document.getElementById(`ficha-${s.id}`)
      if (el) observador.observe(el)
    })
    return () => observador.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, scrollerRef])

  const ir = (s) => {
    const estavaFechada = ctx && !ctx.estaAberta(s.id, s.kind)
    ctx?.abrir(s.id, s.kind)
    setAtivo(s.id)
    const rolar = () => document.getElementById(`ficha-${s.id}`)?.scrollIntoView({ behavior: reduzir ? 'auto' : 'smooth', block: 'start' })
    // Espera a seção terminar de abrir para rolar até a posição certa.
    if (estavaFechada) setTimeout(rolar, 230)
    else rolar()
  }

  const botao = (s, classe, ativoClasse) => (
    <button
      key={s.id}
      type="button"
      onClick={() => ir(s)}
      aria-current={ativo === s.id ? 'true' : undefined}
      className={`${classe} ${ativo === s.id ? ativoClasse : 'text-slate-400 hover:text-ink'}`}
    >
      {s.label}
    </button>
  )

  return (
    <>
      {/* Ficha estreita (painel, celular): atalhos em linha, fixos no topo. */}
      <nav aria-label="Seções da ficha" className="material-thin hairline-b sticky top-0 z-10 -mx-4 mb-5 flex gap-1.5 overflow-x-auto px-4 py-2 @3xl:hidden sm:-mx-6 sm:px-6">
        {secoes.map((s) => botao(s, 'shrink-0 rounded-full px-3 py-1 text-[13px] font-medium transition-colors', 'bg-blue-500/15 text-ink'))}
      </nav>
      {/* Ficha larga: coluna fixa à esquerda. */}
      <nav aria-label="Seções da ficha" className="sticky top-3 hidden self-start @3xl:block">
        <ul className="space-y-0.5">
          {secoes.map((s) => (
            <li key={s.id}>{botao(s, 'block w-full truncate rounded-lg px-3 py-1.5 text-left text-[13px] font-medium transition-colors hover:bg-navy-700/50', 'bg-navy-700/70 text-ink')}</li>
          ))}
        </ul>
      </nav>
    </>
  )
}
