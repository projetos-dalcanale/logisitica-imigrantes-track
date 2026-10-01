import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Archive, ArrowDownToLine, ArrowUpFromLine, LogOut, Moon, Search, Settings, Sun, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { useProcesses } from '../hooks/useProcesses'
import ProcessList from './ProcessList'
import ProcessModal from './ProcessModal'
import NewProcessForm from './NewProcessForm'
import RegistriesModal from './RegistriesModal'
import CommandPalette from './CommandPalette'
import BottomNav from './BottomNav'
import Logo from './Logo'
import Modal from './ui/Modal'
import Segmented from './ui/Segmented'
import { IconButton } from './ui/Tooltip'

export const TABS = [
  { value: 'import', label: 'Importações', short: 'Importação', icon: ArrowDownToLine },
  { value: 'export', label: 'Exportações', short: 'Exportação', icon: ArrowUpFromLine },
  { value: 'archive', label: 'Arquivados', short: 'Arquivados', icon: Archive },
]

const isTyping = (el) => el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
const isMobile = () => window.matchMedia('(max-width: 1023px)').matches

// Tela logada. Desktop: menu lateral com o formulário de novo processo +
// painel principal. Celular: cabeçalho compacto + navegação inferior, e o
// formulário abre em tela cheia.
export default function AppShell() {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { processes, loading } = useProcesses(user.uid)
  const [activeTab, setActiveTab] = useState('import')
  const [openId, setOpenId] = useState(null)
  const [registriesOpen, setRegistriesOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false) // só no celular
  const searchRef = useRef(null)

  const closeProcess = useCallback(() => setOpenId(null), [])
  // Sempre a versão mais recente do Firestore; some sozinho se for excluído.
  const openProc = processes.find((p) => p.id === openId)

  const novoProcesso = useCallback(() => {
    if (isMobile()) setNewOpen(true)
    else document.getElementById('np-nome')?.focus()
  }, [])

  const counts = {
    import: processes.filter((p) => p.status === 'active' && p.type === 'import').length,
    export: processes.filter((p) => p.status === 'active' && p.type === 'export').length,
    archive: processes.filter((p) => p.status === 'archived').length,
  }

  // ATALHOS DE TECLADO: Ctrl/⌘+K busca rápida, "/" busca na lista,
  // N novo processo, 1/2/3 trocam de aba.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
        return
      }
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(document.activeElement)) return
      if (document.querySelector('[role="dialog"]')) return
      if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault()
        novoProcesso()
      } else if (['1', '2', '3'].includes(e.key)) {
        setActiveTab(TABS[Number(e.key) - 1].value)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [novoProcesso])

  const onCreated = (type) => {
    setActiveTab(type) // mostra a aba onde o processo novo aparece
    setNewOpen(false)
  }

  const tabOptions = TABS.map((t) => ({
    value: t.value,
    label: (
      <>
        {t.label}
        <span className={`ml-0.5 rounded-full px-1.5 text-[11px] tabular-nums ${activeTab === t.value ? 'bg-blue-600/10 text-blue-500' : 'bg-slate-500/10 text-slate-500'}`}>
          {counts[t.value]}
        </span>
      </>
    ),
  }))

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* MENU LATERAL (desktop) */}
      <aside className="hidden w-[350px] shrink-0 flex-col border-r border-slate-700/70 bg-navy-800 lg:flex">
        <div className="flex h-16 items-center justify-between border-b border-slate-700/70 px-5">
          <div className="flex items-center gap-2.5">
            <Logo />
            <div className="leading-tight">
              <div className="text-[15px] font-bold tracking-tight text-ink">LogiTrack</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Gestão Logística</div>
            </div>
          </div>
          <IconButton icon={LogOut} label="Sair" onClick={logout} />
        </div>
        <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-ink">Novo processo</h2>
            <span className="kbd">N</span>
          </div>
          <NewProcessForm uid={user.uid} processes={processes} onCreated={onCreated} />
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-700/70 bg-navy-800/80 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5 lg:hidden">
            <Logo />
            <span className="text-[15px] font-bold tracking-tight text-ink">LogiTrack</span>
          </div>
          <Segmented className="hidden lg:flex" options={tabOptions} value={activeTab} onChange={setActiveTab} />

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="hidden h-9 w-60 items-center gap-2 rounded-[10px] border border-slate-700/80 bg-navy-900/60 px-3 text-sm text-slate-500 transition-colors hover:border-slate-600 hover:text-slate-400 md:flex"
            >
              <Search className="size-4" />
              <span className="flex-1 text-left">Buscar processo…</span>
              <span className="kbd">Ctrl K</span>
            </button>
            <IconButton icon={Search} label="Buscar" className="md:hidden" onClick={() => setPaletteOpen(true)} />
            <IconButton icon={Settings} label="Gerenciar cadastros" onClick={() => setRegistriesOpen(true)} />
            <IconButton icon={isDark ? Sun : Moon} label={isDark ? 'Modo claro' : 'Modo escuro'} onClick={toggleTheme} />
            <IconButton icon={LogOut} label="Sair" className="lg:hidden" onClick={logout} />
            <div
              title={user.email}
              className="ml-1.5 hidden size-9 items-center justify-center rounded-full bg-blue-600/12 text-sm font-semibold text-blue-500 ring-1 ring-blue-600/20 sm:flex"
            >
              {(user.email || '?').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="custom-scrollbar flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-7">
            <ProcessList
              processes={processes}
              loading={loading}
              tab={activeTab}
              onOpen={setOpenId}
              searchRef={searchRef}
              onNew={novoProcesso}
            />
          </div>
        </div>
      </main>

      <BottomNav tabs={TABS} counts={counts} active={activeTab} onChange={setActiveTab} onNew={() => setNewOpen(true)} onSearch={() => setPaletteOpen(true)} />

      <AnimatePresence>
        {openProc && <ProcessModal key={openProc.id} proc={openProc} processes={processes} onClose={closeProcess} />}
      </AnimatePresence>
      <AnimatePresence>{registriesOpen && <RegistriesModal key="reg" onClose={() => setRegistriesOpen(false)} />}</AnimatePresence>
      <AnimatePresence>
        {paletteOpen && (
          <CommandPalette
            key="palette"
            processes={processes}
            onClose={() => setPaletteOpen(false)}
            onOpenProcess={(id) => {
              setPaletteOpen(false)
              setOpenId(id)
            }}
            actions={{
              novo: () => {
                setPaletteOpen(false)
                setTimeout(novoProcesso, 50)
              },
              tema: toggleTheme,
              cadastros: () => {
                setPaletteOpen(false)
                setRegistriesOpen(true)
              },
              aba: (tab) => {
                setPaletteOpen(false)
                setActiveTab(tab)
              },
              sair: logout,
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {newOpen && (
          <Modal key="new" onClose={() => setNewOpen(false)} title="Novo processo" fullscreenMobile size="md">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-700/70 px-4">
              <h2 className="text-base font-semibold text-ink">Novo processo</h2>
              <IconButton icon={X} label="Fechar" onClick={() => setNewOpen(false)} />
            </div>
            <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-5 pb-10">
              <NewProcessForm uid={user.uid} processes={processes} onCreated={onCreated} />
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}
