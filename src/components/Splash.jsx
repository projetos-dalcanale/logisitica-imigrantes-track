import Logo from './Logo'

// Tela de abertura enquanto o Firebase confere a sessão. O index.html tem
// uma cópia estática idêntica, exibida enquanto o app ainda está baixando.
export default function Splash() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-5 bg-navy-900">
      <Logo size="lg" />
      <div className="text-center">
        <div className="font-display text-[22px] font-bold tracking-[-0.02em] text-ink">LogiTrack</div>
        <div className="mt-0.5 text-[13px] text-slate-500">Transportes Imigrantes</div>
      </div>
      <div className="splash-bar" role="progressbar" aria-label="Carregando" />
    </div>
  )
}
