import { useEffect, useState } from 'react'
import { REGISTRY_CONFIG, useRegistries } from '../contexts/RegistriesContext'
import { useToast } from '../contexts/ToastContext'

const TABS = [
  { cat: 'cheio', label: 'Term. Carregamento' },
  { cat: 'vazio', label: 'Term. Vazio' },
  { cat: 'armador', label: 'Armador' },
  { cat: 'tipo', label: 'Tipo Contêiner' },
]

// GERENCIAR CADASTROS: adicionar, renomear e excluir itens das listas
// compartilhadas. Acompanha em tempo real edições de outras pessoas.
export default function RegistriesModal({ onClose }) {
  const { lists, adicionar, writeList, sortPt } = useRegistries()
  const showToast = useToast()
  const [cat, setCat] = useState('cheio')
  const cfg = REGISTRY_CONFIG[cat]
  const lista = lists[cat]

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const editar = async (nomeAntigo) => {
    const raw = window.prompt(`Editar "${nomeAntigo}":`, nomeAntigo)
    if (raw === null) return
    const novoNome = raw.trim().slice(0, 150)
    if (!novoNome) return showToast('O nome não pode ficar em branco.', 'error')
    if (novoNome === nomeAntigo) return
    if (lista.includes(novoNome)) return showToast(`Já existe um item chamado "${novoNome}".`, 'error')
    await writeList(cat, sortPt(lista.map((n) => (n === nomeAntigo ? novoNome : n))))
    showToast(`"${nomeAntigo}" renomeado para "${novoNome}".`)
  }

  const excluir = async (nome) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${nome}" da lista de ${cfg.label}?`)) return
    await writeList(cat, lista.filter((n) => n !== nome))
    showToast(`"${nome}" excluído.`)
  }

  const adicionarNovo = async () => {
    const nome = await adicionar(cat)
    if (nome) showToast(`"${nome}" adicionado.`)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="modal-in bg-navy-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col border border-slate-700 overflow-hidden">
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-700 shrink-0">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <i className="fas fa-list-check text-blue-400" /> Gerenciar Cadastros
          </h2>
          <button onClick={onClose} title="Fechar" className="w-9 h-9 rounded-full text-slate-500 hover:text-ink hover:bg-navy-700 text-xl transition flex items-center justify-center">
            &times;
          </button>
        </div>
        <div className="flex gap-1.5 px-5 pt-4 shrink-0 overflow-x-auto custom-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.cat}
              onClick={() => setCat(t.cat)}
              className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-md transition ${t.cat === cat ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
          {lista.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">Nenhum item cadastrado ainda em "{cfg.label}".</p>
          ) : (
            <>
              <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                Editar ou excluir aqui não altera processos já criados com o valor anterior — eles continuam mostrando o nome antigo, sinalizado como "não cadastrado".
              </p>
              <div className="space-y-1.5">
                {lista.map((nome) => (
                  <div key={nome} className="flex items-center justify-between gap-2 bg-navy-900 border border-slate-700 rounded-lg px-3 py-2">
                    <span className="text-sm text-ink truncate">{nome}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => editar(nome)} title="Editar" className="w-7 h-7 rounded-md text-slate-400 hover:text-blue-400 hover:bg-navy-700 text-xs transition flex items-center justify-center">
                        <i className="fas fa-pen" />
                      </button>
                      <button onClick={() => excluir(nome)} title="Excluir" className="w-7 h-7 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-900/20 text-xs transition flex items-center justify-center">
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="p-5 pt-3 border-t border-slate-700 shrink-0">
          <button onClick={adicionarNovo} className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-500 active:scale-[0.99] transition text-sm">
            <i className="fas fa-plus mr-1.5" />Adicionar novo
          </button>
        </div>
      </div>
    </div>
  )
}
