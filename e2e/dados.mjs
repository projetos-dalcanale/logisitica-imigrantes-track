// Dados fictícios dos testes de tela. Existem só no emulador do Firebase,
// que é criado e apagado a cada execução — nada disso chega à produção.
export const USUARIO = { email: 'teste@logitrack.test', senha: 'teste-e2e-1234' }

const checklistVazio = {
  ag_carga: '', ag_carga_check: '', gerar_cte: '', gerar_ciot: '', gerar_mdfe: '',
  encerrar_mdfe: '', ag_vazio: '', ag_vazio_check: '',
}

export const processos = (userId) => [
  {
    id: 'imp-ativo',
    userId, type: 'import', status: 'active', createdAt: '2026-10-01T10:00:00.000Z',
    importador: 'Importadora Teste', armador: 'MSC', documentoTipo: 'DTA', documentoNumero: '26/0000001',
    finalizacaoVazio: 'devolucao', motorista: 'João', placas: 'ABC1D23',
    containers: [{ id: 'c1', numero: 'MSCU 123.456-6', tipo: "40'HC", motorista: '', placas: '', checklist: { ...checklistVazio } }],
  },
  {
    id: 'exp-ativo',
    userId, type: 'export', status: 'active', createdAt: '2026-10-02T10:00:00.000Z',
    exportador: 'Exportadora Teste', armador: 'Maersk', booking: 'BKG777',
    containers: [{ id: 'c2', numero: 'MAEU 765.432-1', tipo: "40'HC", tara: '3800', lacre: 'LC-001', motorista: '', placas: '', checklist: {} }],
  },
  {
    id: 'imp-arquivado',
    userId, type: 'import', status: 'archived', createdAt: '2026-09-01T10:00:00.000Z',
    importador: 'Arquivado Antigo', armador: 'MSC', containers: [],
  },
]
