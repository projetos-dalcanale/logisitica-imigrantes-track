import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Archive, Mail, Plus, ReceiptText, Route, Search } from 'lucide-react'
import { ExportIcon, ImportIcon } from './ui/icons'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { useProcesses } from '../hooks/useProcesses'
import { useFretes } from '../hooks/useFretes'
import { usePedagios } from '../hooks/usePedagios'
import ProcessList from './ProcessList'
import FreteList from './FreteList'
import PedagioList from './PedagioList'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import AccountMenu, { Avatar } from './AccountMenu'
import Button from './ui/Button'
import { IconButton } from './ui/Tooltip'

// Janelas carregadas só quando abertas (deixa a abertura do app mais rápida).
const ProcessModal = lazy(() => import('./ProcessModal'))
const FreteModal = lazy(() => import('./FreteModal'))
const PedagioModal = lazy(() => import('./PedagioModal'))
const NewProcessSheet = lazy(() => import('./NewProcessSheet'))
const RegistriesModal = lazy(() => import('./RegistriesModal'))
const CommandPalette = lazy(() => import('./CommandPalette'))
const StatusClientes = lazy(() => import('./StatusClientes'))

export const TABS = [
  { value: 'import', label: 'Importações', short: 'Importação', icon: ImportIcon },
  { value: 'export', label: 'Exportações', short: 'Exportação', icon: ExportIcon },
  { value: 'archive', label: 'Arquivados', short: 'Arquivados', icon: Archive },
  { value: 'status', label: 'Status para clientes', short: 'Status', icon: Mail },
  { value: 'fretes', label: 'Fretes para CTE', short: 'Fretes CTE', icon: ReceiptText },
  { value: 'pedagios', label: 'Rotas e Valores', short: 'Pedágios', icon: Route },
]
const SECTIONS = [
  { title: 'Processos', tabs: TABS.slice(0, 3) },
  { title: 'Status', tabs: TABS.slice(3, 4) },
  { title: 'Comercial', tabs: TABS.slice(4, 5) },
  { title: 'Pedágios', tabs: TABS.slice(5) },
]
// No celular a barra inferior não comporta todas: "Status" abre pela ficha
// do processo (botão Status) ou pela busca.
const TABS_CELULAR = TABS.filter((t) => t.value !== 'status')
const SUBTITULOS = {
  import: 'Processos de importação em andamento',
  export: 'Processos de exportação em andamento',
  archive: 'Processos concluídos e arquivados',
  status: 'Atualização de um processo por e-mail, pronta para colar',
  fretes: 'Valores e peculiaridades de cada cliente',
  pedagios: 'Rotas e valores de pedágio por número de eixos',
}

const isTyping = (el) => el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))

// Tela logada. Desktop: barra lateral (navegação) + área principal com
// título grande. Celular: barra superior compacta + barra de abas inferior.
export default function AppShell() {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('import')
  const [paletteOpen, setPaletteOpen] = useState(false)
  // Arquivados só carregam quando a aba deles ou a busca rápida é aberta.
  const { processes, loading, loadingArquivo } = useProcesses(user.uid, activeTab === 'archive' || paletteOpen)
  const { fretes, loading: loadingFretes, erro: erroFretes } = useFretes()
  const { pedagios, loading: loadingPedagios, erro: erroPedagios } = usePedagios()
  const [openId, setOpenId] = useState(null)
  const [statusProc, setStatusProc] = useState(null) // processo vindo do botão "Status" da ficha
  const [statusPedido, setStatusPedido] = useState(0)
  const [freteOpen, setFreteOpen] = useState(null) // null | 'new' | id do frete
  const [pedagioOpen, setPedagioOpen] = useState(null) // null | 'new' | id da rota
  const [newOpen, setNewOpen] = useState(false)
  const [registriesOpen, setRegistriesOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const searchRef = useRef(null)
  const scrollRef = useRef(null)
  const isFretes = activeTab === 'fretes'
  const isPedagios = activeTab === 'pedagios'
  const tab = TABS.find((t) => t.value === activeTab)

  const closeProcess = useCallback(() => setOpenId(null), [])
  // Sempre a versão mais recente do Firestore; some sozinho se for excluído.
  const openProc = processes.find((p) => p.id === openId)

  const activeTabRef = useRef(activeTab)
  const novo = useCallback(() => {
    const aba = activeTabRef.current
    if (aba === 'fretes') setFreteOpen('new')
    else if (aba === 'pedagios') setPedagioOpen('new')
    else setNewOpen(true)
  }, [])
  useEffect(() => {
    activeTabRef.current = activeTab
    scrollRef.current?.scrollTo({ top: 0 })
  }, [activeTab])

  // Só os processos em andamento mostram contagem; as demais abas são de consulta.
  const counts = {
    import: processes.filter((p) => p.status === 'active' && p.type === 'import').length,
    export: processes.filter((p) => p.status === 'active' && p.type === 'export').length,
  }

  // ATALHOS DE TECLADO: Ctrl/⌘+K busca rápida, "/" filtra a lista,
  // N novo processo (ou novo frete / nova rota, nas abas de Fretes e Pedágios), 1 a 6 trocam de aba.
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
        novo()
      } else if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        setActiveTab(TABS[Number(e.key) - 1].value)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [novo])

  const onScroll = (e) => {
    const s = e.currentTarget.scrollTop > 44
    if (s !== scrolled) setScrolled(s)
  }

  const accountMenu = (
    <AccountMenu
      side="bottom"
      align="end"
      isDark={isDark}
      onToggleTheme={toggleTheme}
      onOpenRegistries={() => setRegistriesOpen(true)}
      trigger={
        <button type="button" aria-label="Conta" className="rounded-full p-0.5 transition-opacity hover:opacity-80">
          <Avatar email={user.email} size="sm" />
        </button>
      }
    />
  )

  return (
    <div className="flex h-dvh overflow-hidden bg-navy-900">
      <Sidebar
        sections={SECTIONS}
        active={activeTab}
        counts={counts}
        onChange={setActiveTab}
        onSearch={() => setPaletteOpen(true)}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onOpenRegistries={() => setRegistriesOpen(true)}
      />

      <main className="relative flex min-w-0 flex-1 flex-col">
        {/* Barra de ferramentas: ganha material e título compacto ao rolar */}
        <header
          className={`absolute inset-x-0 top-0 z-30 flex h-12 items-center gap-2 px-3 pt-[env(safe-area-inset-top)] transition-[background-color,box-shadow] duration-200 sm:px-5 lg:h-14 lg:px-8 ${scrolled ? 'material-thin hairline-b' : ''}`}
        >
          <div className="flex flex-1 items-center gap-2" />
          <motion.h2
            initial={false}
            animate={{ opacity: scrolled ? 1 : 0, y: scrolled ? 0 : 6 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[15px] font-semibold text-ink lg:static lg:order-first lg:translate-x-0"
          >
            {tab.label}
          </motion.h2>
          <div className="flex flex-1 items-center justify-end gap-1.5">
            <IconButton icon={Search} label="Buscar" shortcut="Ctrl K" className="lg:hidden" onClick={() => setPaletteOpen(true)} />
            <div className="hidden lg:block">
              <Button icon={Plus} onClick={novo}>
                {isFretes ? 'Novo cliente' : isPedagios ? 'Nova rota' : 'Novo processo'}
              </Button>
            </div>
            <div className="lg:hidden">{accountMenu}</div>
          </div>
        </header>

        <div ref={scrollRef} onScroll={onScroll} className="custom-scrollbar flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl px-4 pb-32 pt-[calc(env(safe-area-inset-top)+3.5rem)] sm:px-6 lg:px-10 lg:pb-12 lg:pt-16">
            <div className="mb-6">
              <h1 className="font-display text-[32px] font-bold leading-tight tracking-[-0.025em] text-ink lg:text-[34px]">{tab.label}</h1>
              <p className="mt-0.5 text-[15px] text-slate-400">{SUBTITULOS[activeTab]}</p>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.08 } }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {activeTab === 'status' ? (
                  <Suspense fallback={null}>
                    <StatusClientes key={statusPedido} processes={processes} loading={loading} procInicial={statusProc} />
                  </Suspense>
                ) : isFretes ? (
                  <FreteList fretes={fretes} loading={loadingFretes} erro={erroFretes} onOpen={setFreteOpen} onNew={() => setFreteOpen('new')} searchRef={searchRef} />
                ) : isPedagios ? (
                  <PedagioList pedagios={pedagios} loading={loadingPedagios} erro={erroPedagios} onOpen={setPedagioOpen} onNew={() => setPedagioOpen('new')} searchRef={searchRef} />
                ) : (
                  <ProcessList processes={processes} loading={activeTab === 'archive' ? loadingArquivo : loading} tab={activeTab} onOpen={setOpenId} searchRef={searchRef} onNew={novo} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <BottomNav tabs={TABS_CELULAR} counts={counts} active={activeTab} onChange={setActiveTab} onNew={novo} />

      <Suspense fallback={null}>
        <AnimatePresence>
          {openProc && (
            <ProcessModal
              key={openProc.id}
              proc={openProc}
              processes={processes}
              onClose={closeProcess}
              onEnviarStatus={(id) => {
                setStatusProc(id)
                setStatusPedido((n) => n + 1)
                setOpenId(null)
                setActiveTab('status')
              }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {(freteOpen === 'new' || fretes.some((f) => f.id === freteOpen)) && (
            <FreteModal
              key="frete"
              frete={freteOpen === 'new' ? null : fretes.find((f) => f.id === freteOpen)}
              fretes={fretes}
              onClose={() => setFreteOpen(null)}
              onSaved={setFreteOpen}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {(pedagioOpen === 'new' || pedagios.some((p) => p.id === pedagioOpen)) && (
            <PedagioModal key="pedagio" rota={pedagioOpen === 'new' ? null : pedagios.find((p) => p.id === pedagioOpen)} onClose={() => setPedagioOpen(null)} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {newOpen && (
            <NewProcessSheet
              key="new"
              uid={user.uid}
              processes={processes}
              onClose={() => setNewOpen(false)}
              onCreated={(type) => {
                setNewOpen(false)
                setActiveTab(type) // mostra a aba onde o processo novo aparece
              }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>{registriesOpen && <RegistriesModal key="reg" onClose={() => setRegistriesOpen(false)} />}</AnimatePresence>
        <AnimatePresence>
          {paletteOpen && (
            <CommandPalette
              key="palette"
              processes={processes}
              fretes={fretes}
              onClose={() => setPaletteOpen(false)}
              onOpenProcess={(id) => {
                setPaletteOpen(false)
                setOpenId(id)
              }}
              onOpenFrete={(id) => {
                setPaletteOpen(false)
                setFreteOpen(id)
              }}
              actions={{
                novo: () => {
                  setPaletteOpen(false)
                  setTimeout(novo, 60)
                },
                tema: toggleTheme,
                cadastros: () => {
                  setPaletteOpen(false)
                  setRegistriesOpen(true)
                },
                aba: (t) => {
                  setPaletteOpen(false)
                  setActiveTab(t)
                },
                sair: logout,
              }}
            />
          )}
        </AnimatePresence>
      </Suspense>
    </div>
  )
}
