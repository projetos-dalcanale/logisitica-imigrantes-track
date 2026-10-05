// Fundo da tela de login: brilho suave na cor da marca e um mapa em traço
// fino (rotas tracejadas, pontos de parada e contêineres), sumindo nas bordas.
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

function Ponto({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="9" className="fill-blue-500/10" />
      <circle r="3.5" className="fill-blue-500/70" />
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
        <g className="stroke-slate-500/60" strokeWidth="1.5" strokeDasharray="2 7" strokeLinecap="round" fill="none">
          <path d="M-40 620 C 180 560, 260 420, 420 430 S 700 560, 860 470 S 1100 260, 1260 300" />
          <path d="M-40 180 C 140 220, 240 300, 380 250 S 620 90, 800 160 S 1060 380, 1260 330" />
          <path d="M160 -40 C 200 120, 120 260, 230 380 S 300 640, 260 860" />
          <path d="M1000 -40 C 960 140, 1060 260, 980 420 S 960 700, 1040 860" />
        </g>
        <Conteiner x={150} y={575} r={-12} />
        <Conteiner x={930} y={430} r={-18} />
        <Conteiner x={320} y={265} r={14} />
        <Conteiner x={1020} y={620} r={6} />
        <Conteiner x={760} y={150} r={4} />
        <Ponto x={420} y={430} />
        <Ponto x={860} y={470} />
        <Ponto x={230} y={380} />
        <Ponto x={980} y={420} />
        <Ponto x={800} y={160} />
      </svg>
    </div>
  )
}
