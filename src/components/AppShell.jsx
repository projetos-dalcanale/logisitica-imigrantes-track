import { useCallback, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { useProcesses } from '../hooks/useProcesses'
import ProcessList from './ProcessList'
import ProcessModal from './ProcessModal'
import NewProcessForm from './NewProcessForm'
import RegistriesModal from './RegistriesModal'

const TABS = [
  { id: 'import', short: 'Importação', long: 'Importações Ativas' },
  { id: 'export', short: 'Exportação', long: 'Exportações Ativas' },
  { id: 'archive', short: 'Arquivados', long: 'Arquivados' },
]

// Tela logada: menu lateral (formulário de novo processo) + painel principal
// com abas, resumo e lista de processos; modais de detalhes e de cadastros.
export default function AppShell() {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false) // só no celular
  const [activeTab, setActiveTab] = useState('import')
  const { processes, loading } = useProcesses(user.uid)
  const [openId, setOpenId] = useState(null)
  const closeProcess = useCallback(() => setOpenId(null), [])
  // Sempre a versão mais recente do Firestore; some sozinho se for excluído.
  const openProc = processes.find((p) => p.id === openId)
  const [registriesOpen, setRegistriesOpen] = useState(false)
  const closeRegistries = useCallback(() => setRegistriesOpen(false), [])

  return (
    <div className="h-screen flex overflow-hidden">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[340px] max-w-[85vw] transition-transform duration-300 ease-in-out lg:static lg:z-auto lg:translate-x-0 bg-navy-800 shadow-2xl flex flex-col h-full border-r border-slate-700 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-navy-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-800/60 flex items-center justify-center">
              <i className="fas fa-truck-fast text-blue-400 text-sm" />
            </div>
            <h1 className="text-base font-bold text-ink tracking-tight">LogiTrack</h1>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setSidebarOpen(false)} title="Fechar menu" className="lg:hidden w-8 h-8 rounded-lg text-slate-400 hover:text-ink hover:bg-navy-700 transition flex items-center justify-center">
              <i className="fas fa-xmark text-sm" />
            </button>
            <button onClick={logout} title="Sair" className="w-8 h-8 rounded-lg text-slate-400 hover:text-ink hover:bg-navy-700 transition flex items-center justify-center">
              <i className="fas fa-sign-out-alt text-sm" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <h2 className="text-[11px] font-bold mb-4 text-slate-500 uppercase tracking-widest">Novo Processo</h2>
          <NewProcessForm
            uid={user.uid}
            processes={processes}
            onCreated={(type) => {
              setActiveTab(type) // mostra a aba onde o processo novo aparece
              setSidebarOpen(false) // no celular, fecha a gaveta
            }}
          />
        </div>
      </aside>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-30 lg:hidden" />
      )}

      <main className="flex-1 flex flex-col h-full min-w-0">
        <header className="bg-navy-800 shadow-md border-b border-slate-700 px-4 sm:px-8 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setSidebarOpen(true)} title="Abrir menu" className="lg:hidden shrink-0 w-9 h-9 rounded-lg text-slate-400 hover:text-ink hover:bg-navy-900 transition flex items-center justify-center border border-slate-700">
              <i className="fas fa-bars text-sm" />
            </button>
            <div className="grid grid-cols-3 gap-2 w-full sm:flex sm:w-auto sm:gap-8 sm:overflow-x-auto">
              {TABS.map((tab) => {
                const active = tab.id === activeTab
                const activeClass = tab.id === 'archive' ? 'text-emerald-500 border-emerald-500' : 'text-blue-400 border-blue-400'
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 text-center sm:text-left text-sm font-bold border-b-2 pb-2 transition-colors ${active ? activeClass : 'text-slate-500 hover:text-slate-300 border-transparent'}`}
                  >
                    <span className="sm:hidden">{tab.short}</span>
                    <span className="hidden sm:inline">{tab.long}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setRegistriesOpen(true)} title="Gerenciar Cadastros" className="w-9 h-9 rounded-full text-slate-400 hover:text-ink hover:bg-navy-900 transition flex items-center justify-center border border-slate-700">
              <i className="fas fa-gear text-sm" />
            </button>
            <button onClick={toggleTheme} title="Alternar modo claro/escuro" className="w-9 h-9 rounded-full text-slate-400 hover:text-ink hover:bg-navy-900 transition flex items-center justify-center border border-slate-700">
              <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'} text-sm`} />
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-300 bg-navy-900 pl-2 pr-3.5 py-1.5 rounded-full border border-slate-700">
              <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 text-[10px] font-bold flex items-center justify-center">
                {(user.email || '?').charAt(0).toUpperCase()}
              </span>
              <span>{user.email}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-8 overflow-y-auto custom-scrollbar">
          <ProcessList processes={processes} loading={loading} tab={activeTab} onOpen={setOpenId} />
        </div>
      </main>

      {openProc && <ProcessModal key={openProc.id} proc={openProc} processes={processes} onClose={closeProcess} />}
      {registriesOpen && <RegistriesModal onClose={closeRegistries} />}
    </div>
  )
}
