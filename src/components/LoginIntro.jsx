import { useEffect, useId, useRef } from 'react'
import LoginArt from './LoginArt'

const PIN = 'M12 22.4C12 22.4 4.4 15.2 4.4 9.6A7.6 7.6 0 0 1 19.6 9.6C19.6 15.2 12 22.4 12 22.4Z'
const TAM = 72
const VOO = 1500 // ms: quando o logo, já formado, sai do centro
const FIM = 2100

// Animação logo depois do login: sobre o fundo do login, o logo se forma no
// centro (contorno do pin, preenchimento, caminhão) e voa até o lugar dele na
// barra lateral, enquanto o sistema aparece por baixo. No celular, sem barra
// lateral, o logo encolhe e some. O sistema já carrega os dados por baixo.
// Não bloqueia cliques (pointer-events-none) e some sozinha com onFim.
export default function LoginIntro({ onFim }) {
  const mascara = useId()
  const fundo = useRef(null)
  const voador = useRef(null)
  const contorno = useRef(null)
  const preenchido = useRef(null)
  const caminhao = useRef(null)

  useEffect(() => {
    const root = document.documentElement
    root.classList.add('logo-intro') // esconde o logo da barra lateral até o pouso
    const anims = []
    const A = (el, quadros, opcoes) => {
      const a = el.animate(quadros, { fill: 'forwards', ...opcoes })
      anims.push(a)
      return a
    }

    const x0 = window.innerWidth / 2 - TAM / 2
    const y0 = window.innerHeight / 2 - TAM / 2
    const centro = `translate(${x0}px, ${y0}px)`
    const L = contorno.current.getTotalLength()
    contorno.current.style.strokeDasharray = L
    contorno.current.style.strokeDashoffset = L // sem contorno até começar a desenhar

    A(voador.current, [{ opacity: 0, transform: `${centro} scale(.6)` }, { opacity: 1, transform: `${centro} scale(1)` }], { duration: 340, delay: 200, easing: 'cubic-bezier(.34,1.56,.64,1)' })
    A(contorno.current, [{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: 600, delay: 350, easing: 'cubic-bezier(.65,0,.35,1)' })
    A(preenchido.current, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: 850, easing: 'ease-out' })
    A(caminhao.current, [{ transform: 'scale(0)' }, { transform: 'scale(1.15)', offset: 0.7 }, { transform: 'scale(1)' }], { duration: 320, delay: 950, easing: 'ease-out' })

    // Destino: o logo da barra lateral, se estiver na tela (computador).
    const alvo = [...document.querySelectorAll('[data-logo-alvo]')].map((el) => el.getBoundingClientRect()).find((r) => r.width > 0)
    if (alvo) {
      A(voador.current, [{ transform: `${centro} scale(1)` }, { transform: `translate(${alvo.left}px, ${alvo.top}px) scale(${alvo.width / TAM})` }], { duration: 560, delay: VOO, easing: 'cubic-bezier(.65,0,.35,1)' })
    } else {
      A(voador.current, [{ transform: `${centro} scale(1)`, opacity: 1 }, { transform: `translate(${x0 + TAM * 0.2}px, ${y0 + TAM * 0.2}px) scale(.6)`, opacity: 0 }], { duration: 420, delay: VOO, easing: 'ease-in' })
    }
    A(fundo.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 420, delay: VOO + 80, easing: 'ease-out' })

    const pouso = setTimeout(() => root.classList.remove('logo-intro'), VOO + 560)
    const fim = setTimeout(onFim, FIM)
    return () => {
      clearTimeout(pouso)
      clearTimeout(fim)
      anims.forEach((a) => a.cancel())
      root.classList.remove('logo-intro')
    }
  }, [onFim])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[300]">
      <div ref={fundo} className="absolute inset-0 overflow-hidden bg-navy-900">
        <LoginArt />
      </div>
      <div
        ref={voador}
        style={{ width: TAM, height: TAM, opacity: 0 }}
        className="absolute left-0 top-0 flex origin-top-left items-center justify-center rounded-[20px] bg-gradient-to-b from-blue-500 to-blue-300 text-white shadow-[0_1px_2px_rgb(0_0_0/0.2),inset_0_0.5px_0_rgb(255_255_255/0.35)] dark:to-blue-800"
      >
        <svg viewBox="4 2 16 21" className="h-[45px] overflow-visible">
          <mask id={mascara} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
            <rect width="24" height="24" fill="#fff" />
            <g ref={caminhao} style={{ transformBox: 'fill-box', transformOrigin: 'center', transform: 'scale(0)' }}>
              <rect x="6.5" y="6.9" width="6.5" height="4.7" rx="0.6" fill="#000" />
              <path d="M13.6 8.3h2.4l1.75 1.9v1.4h-4.15z" fill="#000" />
              <path d="M14.25 8.9h1.45l1 1.1h-2.45z" fill="#fff" />
              <circle cx="8.6" cy="12.15" r="1.6" fill="#fff" />
              <circle cx="15.6" cy="12.15" r="1.6" fill="#fff" />
              <circle cx="8.6" cy="12.15" r="0.9" fill="#000" />
              <circle cx="15.6" cy="12.15" r="0.9" fill="#000" />
            </g>
          </mask>
          <path ref={contorno} d={PIN} fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round" />
          <path ref={preenchido} d={PIN} fill="currentColor" mask={`url(#${mascara})`} style={{ opacity: 0 }} />
        </svg>
      </div>
    </div>
  )
}
