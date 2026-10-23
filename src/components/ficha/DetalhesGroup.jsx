import { useState } from 'react'
import { DESTINOS, DOC_TIPOS, ehCargaSolta, limparTerminaisDevolucao } from '../../lib/processos'
import { atualizarProcesso } from '../../lib/processActions'
import RegistrySelect from '../RegistrySelect'
import Segmented from '../ui/Segmented'
import { Row } from '../ui/List'
import SecaoFicha from './SecaoFicha'
import { plainRight, valor } from './comum'

// Dados principais do processo: leitura em linhas ou edição (Editar/Salvar).
export default function DetalhesGroup({ proc, archived }) {
  const isImport = proc.type === 'import'
  const solta = ehCargaSolta(proc)
  // Com 2+ contêineres cada um pode ter o seu terminal de devolução; o do processo vira o padrão.
  const rotuloVazio = (proc.containers || []).length > 1 ? 'Vazio (padrão)' : 'Vazio'
  const [editando, setEditando] = useState(false)
  const [saving, setSaving] = useState(false)
  const inicial = () =>
    isImport
      ? {
          importador: proc.importador || '',
          documentoTipo: proc.documentoTipo || '',
          documentoNumero: proc.documentoNumero || '',
          armador: proc.armador || '',
          termCarga: proc.termCarga || '',
          termVazio: proc.termVazio || '',
          finalizacaoVazio: proc.finalizacaoVazio === 'baixa' ? 'baixa' : 'devolucao',
        }
      : { exportador: proc.exportador || '', booking: proc.booking || '', referencia: proc.referencia || '', navio: proc.navio || '', armador: proc.armador || '' }
  const [form, setForm] = useState(inicial)
  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))
  const input = (field, placeholder) => (
    <input value={form[field]} onChange={(e) => set(field)(e.target.value)} maxLength={150} placeholder={placeholder} className={plainRight} />
  )

  const salvar = async () => {
    setSaving(true)
    try {
      const nome = isImport ? 'importador' : 'exportador'
      const dados = { ...form, [nome]: form[nome].trim() }
      // Na baixa não há devolução, então o terminal de vazio é apagado (também o de cada contêiner).
      await atualizarProcesso(
        proc.id,
        dados.finalizacaoVazio === 'baixa' ? { ...dados, termVazio: '', containers: limparTerminaisDevolucao(proc.containers || []) } : dados
      )
      setEditando(false)
    } finally {
      setSaving(false)
    }
  }

  const action = archived ? null : editando ? (
    <div className="flex gap-3">
      <button type="button" className="text-[13px] text-slate-400 hover:text-ink" onClick={() => (setForm(inicial()), setEditando(false))}>Cancelar</button>
      <button type="button" className="text-[13px] font-semibold text-blue-500 hover:text-blue-400 disabled:opacity-50" disabled={saving} onClick={salvar}>Salvar</button>
    </div>
  ) : (
    <button type="button" className="text-[13px] text-blue-500 hover:text-blue-400" onClick={() => (setForm(inicial()), setEditando(true))}>Editar</button>
  )

  // Resumo mostrado quando a seção está recolhida.
  const resumo = (isImport ? [proc.documentoTipo ? `${proc.documentoTipo} ${proc.documentoNumero || ''}`.trim() : proc.documento, proc.armador] : [proc.booking, proc.armador]).filter(Boolean).join(' · ')
  if (!editando) {
    const docLabel = proc.documentoTipo || 'Documento'
    return (
      <SecaoFicha id="detalhes" kind="detalhes" titulo="Detalhes" resumo={resumo} acao={action}>
        {isImport ? (
          <>
            <Row label={docLabel}>{valor(proc.documentoTipo ? proc.documentoNumero : proc.documento)}</Row>
            <Row label="Armador">{valor(proc.armador)}</Row>
            <Row label="Carregamento">{valor(proc.termCarga)}</Row>
            {solta ? (
              <Row label="Carga">{valor('Carga solta')}</Row>
            ) : (
              <>
                <Row label="Destino">{valor(proc.finalizacaoVazio === 'baixa' ? 'Baixa (sem devolução)' : 'Devolução de vazio')}</Row>
                {proc.finalizacaoVazio !== 'baixa' && <Row label={rotuloVazio}>{valor(proc.termVazio)}</Row>}
              </>
            )}
          </>
        ) : (
          <>
            <Row label="Booking">{valor(proc.booking)}</Row>
            <Row label="Referência">{valor(proc.referencia)}</Row>
            <Row label="Navio">{valor(proc.navio)}</Row>
            <Row label="Armador">{valor(proc.armador)}</Row>
          </>
        )}
      </SecaoFicha>
    )
  }

  return (
    <SecaoFicha id="detalhes" kind="detalhes" titulo="Detalhes" resumo={resumo} acao={action}>
      {isImport ? (
        <>
          <Row label="Importador">{input('importador', 'Nome')}</Row>
          <Row label="Documento"><Segmented size="sm" className="w-48" options={DOC_TIPOS} value={form.documentoTipo} onChange={set('documentoTipo')} /></Row>
          <Row label="Número">{input('documentoNumero', 'Nº do documento')}</Row>
          <Row label="Armador"><RegistrySelect variant="plain" cat="armador" value={form.armador} onChange={set('armador')} /></Row>
          <Row label="Carregamento"><RegistrySelect variant="plain" cat="cheio" value={form.termCarga} onChange={set('termCarga')} placeholder="Terminal" /></Row>
          {!solta && <Row label="Destino"><Segmented size="sm" className="w-56" options={DESTINOS} value={form.finalizacaoVazio} onChange={set('finalizacaoVazio')} /></Row>}
          {form.finalizacaoVazio !== 'baixa' && !solta && (
            <Row label={rotuloVazio}><RegistrySelect variant="plain" cat="vazio" value={form.termVazio} onChange={set('termVazio')} placeholder="Terminal" /></Row>
          )}
        </>
      ) : (
        <>
          <Row label="Exportador">{input('exportador', 'Nome')}</Row>
          <Row label="Booking">{input('booking', 'Número')}</Row>
          <Row label="Referência">{input('referencia', 'Opcional')}</Row>
          <Row label="Navio">{input('navio', 'Nome do navio')}</Row>
          <Row label="Armador"><RegistrySelect variant="plain" cat="armador" value={form.armador} onChange={set('armador')} /></Row>
        </>
      )}
    </SecaoFicha>
  )
}
