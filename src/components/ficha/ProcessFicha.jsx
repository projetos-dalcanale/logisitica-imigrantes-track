import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Archive, ArchiveRestore, CirclePlus, FileText, Mail } from 'lucide-react'
import { ExportIcon, ImportIcon } from '../ui/icons'
import { useToast } from '../../contexts/ToastContext'
import { useDialog } from '../../contexts/DialogContext'
import { draftAlertConfig, ehCargaSolta, formatarDataHoraCurta, formatarPlacas, getDraftDeadlineInfo, getProcessProgress } from '../../lib/processos'
import { adicionarContainer, atualizarProcesso, excluirProcesso } from '../../lib/processActions'
import { exportarProcessoPDF } from '../../lib/exportar'
import { secoesDaFicha } from '../../lib/ficha'
import AutoSaveInput from '../AutoSaveInput'
import { DraftIcon } from '../ProcessCard'
import Button from '../ui/Button'
import DeleteButton from '../ui/DeleteButton'
import { Group, Row } from '../ui/List'
import AgendamentosRows from './AgendamentosRows'
import ContainerGroup from './ContainerGroup'
import DetalhesGroup from './DetalhesGroup'
import FichaIndice from './FichaIndice'
import SecaoFicha from './SecaoFicha'
import { SecoesContext, useSecoesEstado } from './secoes'
import { plainRight } from './comum'

// FICHA DO PROCESSO (sem moldura): corpo rolável + rodapé de ações. Serve à
// janela (ProcessModal) e ao painel lateral (ProcessPanel). Tudo salva sozinho
// no Firestore, e a ficha acompanha em tempo real alterações feitas em outra
// aba ou dispositivo.
export default function ProcessFicha({ proc, processes, onClose, onEnviarStatus }) {
  const showToast = useToast()
  const { confirm } = useDialog()
  const secoesEstado = useSecoesEstado()
  const scrollerRef = useRef(null)
  // Relógio da ficha: fixado ao abrir (as marcações de horário usam a hora real).
  const [now] = useState(() => Date.now())
  const isImport = proc.type === 'import'
  const archived = proc.status === 'archived'
  const containers = proc.containers || []
  const draftInfo = getDraftDeadlineInfo(proc)
  const progress = getProcessProgress(proc)
  const title = isImport ? proc.importador || 'Processo de importação' : proc.exportador || 'Processo de exportação'
  const saveProcField = (field) => (v) => atualizarProcesso(proc.id, { [field]: v })
  const secoes = secoesDaFicha(proc)

  const setStatus = async (status) => {
    const arquivar = status === 'archived'
    const ok = await confirm({
      title: arquivar ? 'Arquivar processo?' : 'Desarquivar processo?',
      message: arquivar ? 'Ele sai da lista de ativos e fica disponível em Arquivados.' : 'Ele volta para a lista de processos ativos.',
      confirmLabel: arquivar ? 'Arquivar' : 'Desarquivar',
    })
    if (!ok) return
    await atualizarProcesso(proc.id, { status })
    onClose()
    showToast(arquivar ? 'Processo arquivado.' : 'Processo restaurado para Ativos.')
  }

  // A confirmação acontece no próprio botão (lixeira → ✓/✕). Espera o check
  // aparecer antes de excluir, senão a ficha fecha antes da animação.
  const excluir = () => {
    setTimeout(async () => {
      try {
        await excluirProcesso(proc.id)
        onClose()
        showToast('Processo excluído.')
      } catch (error) {
        console.error('Erro ao excluir:', error)
        showToast('Não foi possível excluir. Verifique as regras de segurança do Firestore.', 'error')
      }
    }, 700)
  }

  const resumoTransporte = [proc.motorista, formatarPlacas(proc.placas)].filter(Boolean).join(' · ')
  const agCarga = formatarDataHoraCurta(containers[0]?.checklist?.ag_carga)
  const resumoObservacoes = (proc.observacoes || '').replace(/\s+/g, ' ').trim().slice(0, 70)

  return (
    <SecoesContext.Provider value={secoesEstado}>
      <div className="@container flex min-h-0 flex-1 flex-col">
        <div ref={scrollerRef} className="custom-scrollbar flex-1 overflow-y-auto px-4 pb-8 sm:px-6">
          <div className="space-y-6">
            <div className="px-1">
              <div className="mb-1 flex items-center gap-1.5 text-[13px] font-medium text-slate-400">
                {isImport ? <ImportIcon className="size-3.5" strokeWidth={2.4} /> : <ExportIcon className="size-3.5" strokeWidth={2.4} />}
                {isImport ? 'Importação' : 'Exportação'}
                {archived && <span className="ml-1 rounded-full bg-slate-500/15 px-2 py-px text-[11px]">Arquivado</span>}
              </div>
              <h2 className="font-display text-[26px] font-bold leading-tight tracking-[-0.025em] text-ink">{title}</h2>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-500/15">
                  <motion.div
                    className={`h-full rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 22 }}
                  />
                </div>
                <span className="text-xs font-medium tabular-nums text-slate-400">{progress}%</span>
              </div>
            </div>

            {draftInfo && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className={`flex items-center gap-3 rounded-xl px-4 py-3 ${draftAlertConfig[draftInfo.nivel].soft}`}>
                <DraftIcon nivel={draftInfo.nivel} className={`size-5 ${draftAlertConfig[draftInfo.nivel].iconColor}`} />
                <p className={`text-[15px] font-semibold ${draftAlertConfig[draftInfo.nivel].text}`}>{draftInfo.texto}</p>
              </motion.div>
            )}
          </div>

          <div className="mt-6 @3xl:grid @3xl:grid-cols-[10.5rem_minmax(0,1fr)] @3xl:gap-8">
            <FichaIndice secoes={secoes} scrollerRef={scrollerRef} />

            <div className="min-w-0 space-y-6">
              <DetalhesGroup key={archived ? 'a' : 'b'} proc={proc} archived={archived} />

              {/* Com mais de um contêiner, motorista e placas ficam em cada contêiner. */}
              {containers.length <= 1 && (
                <SecaoFicha id="transporte" kind="transporte" titulo="Transporte" resumo={resumoTransporte}>
                  <Row label="Motorista"><AutoSaveInput type="text" placeholder="Nome" maxLength={150} value={proc.motorista} disabled={archived} onSave={saveProcField('motorista')} className={plainRight} /></Row>
                  <Row label="Placas"><AutoSaveInput type="text" placeholder="ABC1D23" maxLength={150} value={proc.placas} disabled={archived} onSave={saveProcField('placas')} className={plainRight} /></Row>
                </SecaoFicha>
              )}

              {/* Com um contêiner, os agendamentos ficam aqui, como o transporte. */}
              {isImport && containers.length === 1 && (
                <SecaoFicha id="agendamentos" kind="agendamentos" titulo="Agendamentos" resumo={agCarga ? `Carregamento ${agCarga}` : ''}>
                  <AgendamentosRows proc={proc} ct={containers[0]} disabled={archived} />
                </SecaoFicha>
              )}

              <SecaoFicha id="observacoes" kind="observacoes" titulo="Observações" resumo={resumoObservacoes}>
                <div className="px-4 py-3">
                  <AutoSaveInput
                    as="textarea"
                    placeholder="Recados rápidos para a equipe (ex: aguardando liberação da Receita)…"
                    maxLength={1000}
                    rows={3}
                    value={proc.observacoes}
                    disabled={archived}
                    onSave={saveProcField('observacoes')}
                    className="field-plain resize-none"
                  />
                </div>
              </SecaoFicha>

              <AnimatePresence initial={false}>
                {containers.map((ct, index) => (
                  <ContainerGroup key={ct.id} proc={proc} ct={ct} index={index} processes={processes} disabled={archived} multi={containers.length > 1} now={now} />
                ))}
              </AnimatePresence>

              {!archived && !ehCargaSolta(proc) && (
                <Group>
                  <button
                    type="button"
                    onClick={() => adicionarContainer(proc)}
                    className="flex min-h-11 w-full items-center gap-3 px-4 text-left text-[15px] text-blue-500 transition-colors hover:bg-navy-700/40"
                  >
                    <CirclePlus className="size-5 fill-emerald-500 text-white dark:text-navy-800" strokeWidth={2} />
                    Adicionar contêiner
                  </button>
                </Group>
              )}
              {archived && containers.length === 0 && <p className="px-4 text-sm text-slate-500">Nenhum contêiner neste processo.</p>}
            </div>
          </div>
        </div>

        <footer className="hairline-t flex shrink-0 items-center gap-2 bg-navy-900/80 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-6">
          <DeleteButton label="Excluir processo" onConfirm={excluir} />
          <div className="ml-auto flex gap-2">
            {!archived && onEnviarStatus && (
              <Button variant="gray" icon={Mail} onClick={() => onEnviarStatus(proc.id)}>Status</Button>
            )}
            <Button variant="gray" icon={FileText} onClick={() => exportarProcessoPDF(proc)}>PDF</Button>
            {archived ? (
              <Button icon={ArchiveRestore} onClick={() => setStatus('active')}>Desarquivar</Button>
            ) : (
              <Button variant="success" icon={Archive} onClick={() => setStatus('archived')}>Arquivar</Button>
            )}
          </div>
        </footer>
      </div>
    </SecoesContext.Provider>
  )
}
