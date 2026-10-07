// Fundo da tela de login: brilho suave na cor da marca e um mapa em traço
// fino (rotas tracejadas, pontos de parada e contêineres), sumindo nas bordas.
// Animado: o tracejado anda, as paradas pulsam e veículos percorrem as rotas.
// Com "reduzir movimento" no sistema, fica parado e sem os veículos.
const ROTAS = [
  { id: 'rota-1', dur: 22, lenta: false, d: 'M-40 620 C 180 560, 260 420, 420 430 S 700 560, 860 470 S 1100 260, 1260 300' },
  { id: 'rota-2', dur: 26, lenta: true, d: 'M-40 180 C 140 220, 240 300, 380 250 S 620 90, 800 160 S 1060 380, 1260 330' },
  { id: 'rota-3', dur: 18, lenta: true, d: 'M160 -40 C 200 120, 120 260, 230 380 S 300 640, 260 860' },
  { id: 'rota-4', dur: 20, lenta: false, d: 'M1000 -40 C 960 140, 1060 260, 980 420 S 960 700, 1040 860' },
]

// 10 veículos repartidos entre as rotas, espaçados ao longo de cada uma e com
// velocidades levemente diferentes, pra não andarem em fila.
const VEICULOS = Array.from({ length: 10 }, (_, i) => {
  const rota = ROTAS[i % ROTAS.length]
  const naRota = Math.ceil((10 - (i % ROTAS.length)) / ROTAS.length)
  const dur = rota.dur * (1 + (((i * 7) % 5) - 2) * 0.06)
  const inicio = dur * (Math.floor(i / ROTAS.length) / naRota) + (i % ROTAS.length) * 1.3
  return { rota: rota.id, dur: dur.toFixed(1), inicio: (-inicio).toFixed(1) }
})

function Conteiner({ x, y, r = 0 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`} className="stroke-slate-500" strokeWidth="1.5" fill="none">
      <rect x="-22" y="-10" width="44" height="20" rx="2.5" />
      {[-14, -7, 0, 7, 14].map((lx) => (
        <line key={lx} x1={lx} y1="-6" x2={lx} y2="6" strokeLinecap="round" />
      ))}
    </g>
  )
}

function Ponto({ x, y, atraso }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="9" className="login-pulso fill-blue-500" style={{ animationDelay: `${atraso}s` }} />
      <circle r="9" className="fill-blue-500/10" />
      <circle r="3.5" className="fill-blue-500/70" />
    </g>
  )
}

function Veiculo({ rota, dur, inicio }) {
  return (
    <g>
      <circle r="10" className="fill-blue-500/20" />
      <circle r="4.5" strokeWidth="2" className="fill-blue-500 stroke-navy-900" />
      <animateMotion dur={`${dur}s`} begin={`${inicio}s`} repeatCount="indefinite">
        <mpath href={`#${rota}`} />
      </animateMotion>
    </g>
  )
}

export default function LoginArt() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-48 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/15" />
      <svg
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full opacity-60 [mask-image:radial-gradient(ellipse_at_center,transparent_22%,black_48%,transparent_80%)] dark:opacity-45"
      >
        <defs>
          {ROTAS.map((r) => <path key={r.id} id={r.id} d={r.d} />)}
        </defs>
        <g className="stroke-slate-500/60" strokeWidth="1.5" strokeDasharray="2 7" strokeLinecap="round" fill="none">
          {ROTAS.map((r) => <use key={r.id} href={`#${r.id}`} className={`login-rota ${r.lenta ? 'login-rota-lenta' : ''}`} />)}
        </g>
        <Conteiner x={150} y={575} r={-12} />
        <Conteiner x={930} y={430} r={-18} />
        <Conteiner x={320} y={265} r={14} />
        <Conteiner x={1020} y={620} r={6} />
        <Conteiner x={760} y={150} r={4} />
        <Ponto x={420} y={430} atraso={0} />
        <Ponto x={860} y={470} atraso={0.8} />
        <Ponto x={230} y={380} atraso={1.6} />
        <Ponto x={980} y={420} atraso={2.2} />
        <Ponto x={800} y={160} atraso={1.1} />
        <g className="motion-reduce:hidden">
          {VEICULOS.map((v, i) => <Veiculo key={i} {...v} />)}
        </g>
      </svg>
    </div>
  )
}
